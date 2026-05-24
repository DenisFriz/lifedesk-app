import { db, WorkoutRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateWorkoutInput = Omit<
  WorkoutRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const workoutRepository = {
  update: async (id: string, data: Partial<WorkoutRecord>) => {
    let existing = await db.workouts.get(id)

    if (!existing) {
      existing = await db.workouts.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Workout item not found')
    }

    const updatedWorkout: WorkoutRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.workouts.put(updatedWorkout)

    await enqueueMutation('workouts', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedWorkout
  },
  create: async (data: CreateWorkoutInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const workout: WorkoutRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.workouts.put(workout)

    await enqueueMutation('workouts', 'create', {
      ...data,
      optimisticId
    })

    return workout
  },
  delete: async (id: string) => {
    let existing = await db.workouts.get(id)

    if (!existing) {
      existing = await db.workouts.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Workout item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.workouts.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('workouts')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('workouts', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
