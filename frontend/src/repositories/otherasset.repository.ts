import { db, OtherAssetRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateOtherAssetInput = Omit<
  OtherAssetRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const otherAssetRepository = {
  update: async (id: string, data: Partial<OtherAssetRecord>) => {
    let existing = await db.otherassets.get(id)

    if (!existing) {
      existing = await db.otherassets.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('OtherAsset not found')
    }

    const updatedOtherAsset: OtherAssetRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.otherassets.put(updatedOtherAsset)

    await enqueueMutation('otherassets', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedOtherAsset
  },
  create: async (data: CreateOtherAssetInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const otherAsset: OtherAssetRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.otherassets.put(otherAsset)

    await enqueueMutation('otherassets', 'create', {
      ...data,
      optimisticId
    })

    return otherAsset
  },
  delete: async (id: string) => {
    let existing = await db.otherassets.get(id)

    if (!existing) {
      existing = await db.otherassets.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('OtherAsset not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.otherassets.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('otherassets')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('otherassets', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
