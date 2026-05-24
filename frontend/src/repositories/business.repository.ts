import { BusinessRecord, db } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateBusinessInput = Omit<
  BusinessRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const businessRepository = {
  update: async (id: string, data: Partial<BusinessRecord>) => {
    let existing = await db.businesses.get(id)

    if (!existing) {
      existing = await db.businesses.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Business item not found')
    }

    const updated: BusinessRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.businesses.put(updated)

    await enqueueMutation('businesses', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateBusinessInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const learning: BusinessRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.businesses.put(learning)

    await enqueueMutation('businesses', 'create', {
      ...data,
      optimisticId
    })

    return learning
  },
  delete: async (id: string) => {
    let existing = await db.businesses.get(id)

    if (!existing) {
      existing = await db.businesses.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Business item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.businesses.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('businesses')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('businesses', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
