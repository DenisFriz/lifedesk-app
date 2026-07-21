import { db, GoalRecord, TaskRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type GoalCreateInput = Pick<
  GoalRecord,
  | 'title'
  | 'status'
  | 'order'
  | 'category'
  | 'important'
  | 'target_date'
  | 'target_time'
  | 'business_id'
>

export const goalRepository = {
  update: async (id: string, data: Partial<GoalRecord>) => {
    let existing = await db.goals.get(id)

    if (!existing) {
      existing = await db.goals.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Goal not found')
    }

    const updatedGoal: GoalRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.goals.put(updatedGoal)

    await enqueueMutation('goals', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedGoal
  },
  create: async (data: GoalCreateInput) => {
    const optimisticId = generateOptimisticId()
    const goal = {
      ...data,
      id: optimisticId,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false,
      reminders: []
    }

    await db.goals.put(goal)
    await enqueueMutation('goals', 'create', { ...data, optimisticId })

    return goal
  },
  delete: async (id: string) => {
    let existing = await db.goals.get(id)

    if (!existing) {
      existing = await db.goals.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Goal not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.goals.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('goals')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('goals', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })
  },
  bulkDelete: async (ids: string[]) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.goals.get(id)) ?? (await db.goals.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validGoals = targets.filter(Boolean) as GoalRecord[]

    if (validGoals.length === 0) return []

    const updatedGoals = validGoals.map(goal => ({
      ...goal,
      is_deleted: true,
      updatedAt: now
    }))

    await db.transaction('rw', db.goals, db.syncQueue, async () => {
      await db.goals.bulkPut(updatedGoals)

      const idsToRemove = validGoals.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('goals')
        .and(item => idsToRemove.includes(item.payload?.id as string))
        .delete()

      for (const goal of validGoals) {
        await enqueueMutation('goals', 'delete', {
          id: goal.serverId ?? goal.id,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedGoals
  },
  bulkUpdate: async (ids: string[], data: Partial<GoalRecord>) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.goals.get(id)) ?? (await db.goals.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validGoals = targets.filter(Boolean) as GoalRecord[]

    if (validGoals.length === 0) return []

    const updatedGoals = validGoals.map(goal => ({
      ...goal,
      ...data,
      updatedAt: now
    }))

    await db.transaction('rw', db.goals, db.syncQueue, async () => {
      await db.goals.bulkPut(updatedGoals)

      const idsToClean = validGoals.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('goals')
        .and(item => {
          const payloadId = item.payload?.id
          return typeof payloadId === 'string' && idsToClean.includes(payloadId)
        })
        .delete()

      for (const goal of validGoals) {
        await enqueueMutation('goals', 'update', {
          id: goal.serverId ?? goal.id,
          ...data,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedGoals
  },
  duplicate: async (goal: GoalRecord) => {
    const { id, serverId, createdAt, updatedAt, ...rest } = goal

    const optimisticId = generateOptimisticId()

    const duplicatedGoal: GoalRecord = {
      ...rest,
      id: optimisticId,
      title: `${rest.title} (copy)`,
      status: 'active',
      order: (goal.order ?? 0) + 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false
    }

    const relatedTasks = await db.tasks
      .filter(t => !t.is_deleted && (t.goal_id === id || (!!serverId && t.goal_id === serverId)))
      .toArray()

    await db.transaction('rw', db.goals, db.tasks, db.syncQueue, async () => {
      await db.goals.put(duplicatedGoal)

      await enqueueMutation('goals', 'create', {
        ...duplicatedGoal,
        optimisticId
      })

      for (const task of relatedTasks) {
        const {
          id: taskId,
          serverId: taskServerId,
          createdAt: tCreatedAt,
          updatedAt: tUpdatedAt,
          ...taskRest
        } = task
        const taskOptimisticId = generateOptimisticId()

        const duplicatedTask: TaskRecord = {
          ...taskRest,
          id: taskOptimisticId,
          goal_id: optimisticId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          is_deleted: false
        }

        await db.tasks.put(duplicatedTask)
        await enqueueMutation('tasks', 'create', {
          ...duplicatedTask,
          optimisticId: taskOptimisticId
        })
      }
    })

    return duplicatedGoal
  }
}
