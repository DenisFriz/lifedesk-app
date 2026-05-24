import { BodyMeasurementRecord, db } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateBodyMeasurementInput = Omit<
  BodyMeasurementRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const bodyMeasurementRepository = {
  update: async (id: string, data: Partial<BodyMeasurementRecord>) => {
    let existing = await db.bodymeasurements.get(id)

    if (!existing) {
      existing = await db.bodymeasurements.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Body measurement item not found')
    }

    const updatedBodyMeasurement: BodyMeasurementRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.bodymeasurements.put(updatedBodyMeasurement)

    await enqueueMutation('bodymeasurements', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedBodyMeasurement
  },
  create: async (data: CreateBodyMeasurementInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const learning: BodyMeasurementRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.bodymeasurements.put(learning)

    await enqueueMutation('bodymeasurements', 'create', {
      ...data,
      optimisticId
    })

    return learning
  },
  delete: async (id: string) => {
    let existing = await db.bodymeasurements.get(id)

    if (!existing) {
      existing = await db.bodymeasurements.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Body measurement item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.bodymeasurements.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('bodymeasurements')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('bodymeasurements', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
