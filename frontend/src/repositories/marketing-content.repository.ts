import { db, MarketingContentRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateMarketingContentInput = Omit<
  MarketingContentRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const marketingContentRepository = {
  update: async (id: string, data: Partial<MarketingContentRecord>) => {
    let existing = await db.marketingcontents.get(id)

    if (!existing) {
      existing = await db.marketingcontents.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Marketing content not found')
    }

    const updatedMarketingContent: MarketingContentRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.marketingcontents.put(updatedMarketingContent)

    await enqueueMutation('marketingcontents', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedMarketingContent
  },
  create: async (data: CreateMarketingContentInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const marketingContent: MarketingContentRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.marketingcontents.put(marketingContent)

    await enqueueMutation('marketingcontents', 'create', {
      ...data,
      optimisticId
    })

    return marketingContent
  },
  delete: async (id: string) => {
    let existing = await db.marketingcontents.get(id)

    if (!existing) {
      existing = await db.marketingcontents.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Marketing content not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.marketingcontents.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('marketingcontents')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('marketingcontents', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
