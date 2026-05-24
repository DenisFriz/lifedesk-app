import { db, HobbyRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateHobbyInput = Omit<
  HobbyRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const hobbyRepository = {
  update: async (id: string, data: Partial<HobbyRecord>) => {
    let existing = await db.hobbies.get(id)

    if (!existing) {
      existing = await db.hobbies.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Hobby not found')
    }

    const updated: HobbyRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.hobbies.put(updated)

    await enqueueMutation('hobbies', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateHobbyInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const hobby: HobbyRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.hobbies.put(hobby)

    await enqueueMutation('learning', 'create', {
      ...data,
      optimisticId
    })

    return hobby
  },
  delete: async (id: string) => {
    let existing = await db.hobbies.get(id)

    if (!existing) {
      existing = await db.hobbies.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Hobby not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.hobbies.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('hobbies')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('hobbies', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
