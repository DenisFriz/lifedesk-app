import { db, TaskRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export const taskRepository = {
  update: async (id: string, data: Partial<TaskRecord>) => {
    let existing = await db.tasks.get(id)

    if (!existing) {
      existing = await db.tasks.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Task not found')
    }

    const updatedTask: TaskRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.tasks.put(updatedTask)

    await enqueueMutation('tasks', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedTask
  },
  create: async (data: TaskRecord) => {
    const optimisticId = generateOptimisticId()
    const task = {
      ...data,
      id: optimisticId,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false
    }

    await db.tasks.put(task)
    await enqueueMutation('tasks', 'create', { ...data, optimisticId })

    return task
  },
  delete: async (id: string) => {
    let existing = await db.tasks.get(id)

    if (!existing) {
      existing = await db.tasks.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Task not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.tasks.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('tasks')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('tasks', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })
  },
  bulkDelete: async (ids: string[]) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.tasks.get(id)) ?? (await db.tasks.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validTasks = targets.filter(Boolean) as TaskRecord[]

    if (validTasks.length === 0) return []

    const updatedTasks = validTasks.map(task => ({
      ...task,
      is_deleted: true,
      updatedAt: now
    }))

    await db.transaction('rw', db.tasks, db.syncQueue, async () => {
      await db.tasks.bulkPut(updatedTasks)

      const idsToRemove = validTasks.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('tasks')
        .and(item => idsToRemove.includes(item.payload?.id as string))
        .delete()

      for (const task of validTasks) {
        await enqueueMutation('tasks', 'delete', {
          id: task.serverId ?? task.id,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedTasks
  },
  bulkUpdate: async (ids: string[], data: Partial<TaskRecord>) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.tasks.get(id)) ?? (await db.tasks.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validTasks = targets.filter(Boolean) as TaskRecord[]

    if (validTasks.length === 0) return []

    const updatedTasks = validTasks.map(task => ({
      ...task,
      ...data,
      updatedAt: now
    }))

    await db.transaction('rw', db.tasks, db.syncQueue, async () => {
      await db.tasks.bulkPut(updatedTasks)

      const idsToClean = validTasks.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('tasks')
        .and(item => {
          const payloadId = item.payload?.id
          return typeof payloadId === 'string' && idsToClean.includes(payloadId)
        })
        .delete()

      for (const task of validTasks) {
        await enqueueMutation('tasks', 'update', {
          id: task.serverId ?? task.id,
          ...data,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedTasks
  },
  duplicate: async (task: TaskRecord) => {
    const { id, serverId, createdAt, updatedAt, ...rest } = task

    const optimisticId = generateOptimisticId()

    const duplicatedTask: TaskRecord = {
      ...rest,
      id: optimisticId,
      title: `${rest.title} (copy)`,
      status: 'pending',
      order: (task.order ?? 0) + 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false
    }

    await db.tasks.put(duplicatedTask)

    await enqueueMutation('tasks', 'create', {
      ...duplicatedTask,
      optimisticId
    })

    return duplicatedTask
  }
}
