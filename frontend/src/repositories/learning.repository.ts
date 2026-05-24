import { db, LearningRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateLearningInput = Omit<
  LearningRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const learningRepository = {
  update: async (id: string, data: Partial<LearningRecord>) => {
    let existing = await db.learning.get(id)

    if (!existing) {
      existing = await db.learning.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Learning item not found')
    }

    const updatedLearning: LearningRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.learning.put(updatedLearning)

    await enqueueMutation('learning', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedLearning
  },
  create: async (data: CreateLearningInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const learning: LearningRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.learning.put(learning)

    await enqueueMutation('learning', 'create', {
      ...data,
      optimisticId
    })

    return learning
  },
  delete: async (id: string) => {
    let existing = await db.learning.get(id)

    if (!existing) {
      existing = await db.learning.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Learning item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.learning.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('learning')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('learning', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
