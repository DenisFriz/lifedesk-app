import { CommunityIdeaRecord, db } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateCommunityIdeaInput = Omit<
  CommunityIdeaRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const communityIdeaRepository = {
  update: async (id: string, data: Partial<CommunityIdeaRecord>) => {
    let existing = await db.communityideas.get(id)

    if (!existing) {
      existing = await db.communityideas.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Community Idea not found')
    }

    const updated: CommunityIdeaRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.communityideas.put(updated)

    await enqueueMutation('communityideas', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateCommunityIdeaInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const communityIdea: CommunityIdeaRecord = {
      ...data,
      status: data.status ?? 'new',

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.communityideas.put(communityIdea)

    await enqueueMutation('communityideas', 'create', {
      ...data,
      optimisticId
    })

    return communityIdea
  },
  delete: async (id: string) => {
    let existing = await db.communityideas.get(id)

    if (!existing) {
      existing = await db.communityideas.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Community Idea not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.communityideas.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('communityideas')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('communityideas', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
