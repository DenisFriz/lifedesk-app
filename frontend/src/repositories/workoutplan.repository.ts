import { db, WorkoutPlanRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateWorkoutPlanInput = Omit<
  WorkoutPlanRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const workoutPlanRepository = {
  update: async (id: string, data: Partial<WorkoutPlanRecord>) => {
    let existing = await db.workoutplans.get(id)

    if (!existing) {
      existing = await db.workoutplans.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Workout plan item not found')
    }

    const updatedWorkoutplan: WorkoutPlanRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.workoutplans.put(updatedWorkoutplan)

    await enqueueMutation('workoutplans', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedWorkoutplan
  },
  create: async (data: CreateWorkoutPlanInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const workoutplan: WorkoutPlanRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.workoutplans.put(workoutplan)

    await enqueueMutation('workoutplans', 'create', {
      ...data,
      optimisticId
    })

    return workoutplan
  },
  delete: async (id: string) => {
    let existing = await db.workoutplans.get(id)

    if (!existing) {
      existing = await db.workoutplans.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Workout plan item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.workoutplans.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('workoutplans')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('workoutplans', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
