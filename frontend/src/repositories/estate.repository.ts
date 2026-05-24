import { db, EstateRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateEstateInput = Omit<
  EstateRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const estateRepository = {
  update: async (id: string, data: Partial<EstateRecord>) => {
    let existing = await db.estates.get(id)

    if (!existing) {
      existing = await db.estates.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Estate not found')
    }

    const updatedEstate: EstateRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.estates.put(updatedEstate)

    await enqueueMutation('estates', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedEstate
  },
  create: async (data: CreateEstateInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const estate: EstateRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.estates.put(estate)

    await enqueueMutation('vehicles', 'create', {
      ...data,
      optimisticId
    })

    return estate
  },
  delete: async (id: string) => {
    let existing = await db.estates.get(id)

    if (!existing) {
      existing = await db.estates.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Vehicle not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.estates.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('estates')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('estates', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
