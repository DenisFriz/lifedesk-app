import { db, ProgressPhotoRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateProgressPhotoInput = Omit<
  ProgressPhotoRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const progressPhotosRepository = {
  update: async (id: string, data: Partial<ProgressPhotoRecord>) => {
    let existing = await db.progressphotos.get(id)

    if (!existing) {
      existing = await db.progressphotos.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Progress photo item not found')
    }

    const updated: ProgressPhotoRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.progressphotos.put(updated)

    await enqueueMutation('progressphotos', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateProgressPhotoInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const progressPhoto: ProgressPhotoRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.progressphotos.put(progressPhoto)

    await enqueueMutation('progressphotos', 'create', {
      ...data,
      optimisticId
    })

    return progressPhoto
  },
  delete: async (id: string) => {
    let existing = await db.progressphotos.get(id)

    if (!existing) {
      existing = await db.progressphotos.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Progress photo item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.progressphotos.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('progressphotos')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('progressphotos', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  },
  bulkDelete: async (ids: string[]) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.progressphotos.get(id)) ??
          (await db.progressphotos.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validProgressPhotos = targets.filter(Boolean) as ProgressPhotoRecord[]

    if (validProgressPhotos.length === 0) return []

    const updatedGoals = validProgressPhotos.map(goal => ({
      ...goal,
      is_deleted: true,
      updatedAt: now
    }))

    await db.transaction('rw', db.progressphotos, db.syncQueue, async () => {
      await db.progressphotos.bulkPut(updatedGoals)

      const idsToRemove = validProgressPhotos.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('progressphotos')
        .and(item => idsToRemove.includes(item.payload?.id as string))
        .delete()

      for (const progressPhoto of validProgressPhotos) {
        await enqueueMutation('progressphotos', 'delete', {
          id: progressPhoto.serverId ?? progressPhoto.id,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedGoals
  },
  bulkUpdate: async (ids: string[], data: Partial<ProgressPhotoRecord>) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.progressphotos.get(id)) ??
          (await db.progressphotos.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validProgressPhotos = targets.filter(Boolean) as ProgressPhotoRecord[]

    if (validProgressPhotos.length === 0) return []

    const updatedProgressPhotos = validProgressPhotos.map(goal => ({
      ...goal,
      ...data,
      updatedAt: now
    }))

    await db.transaction('rw', db.progressphotos, db.syncQueue, async () => {
      await db.progressphotos.bulkPut(updatedProgressPhotos)

      const idsToClean = validProgressPhotos.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('progressphotos')
        .and(item => {
          const payloadId = item.payload?.id
          return typeof payloadId === 'string' && idsToClean.includes(payloadId)
        })
        .delete()

      for (const progressPhoto of validProgressPhotos) {
        await enqueueMutation('progressphotos', 'update', {
          id: progressPhoto.serverId ?? progressPhoto.id,
          ...data,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedProgressPhotos
  }
}
