import { db, MarketingStrategyRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateMarketingStrategyInput = Omit<
  MarketingStrategyRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const marketingStrategyRepository = {
  update: async (id: string, data: Partial<MarketingStrategyRecord>) => {
    let existing = await db.marketingstrategies.get(id)

    if (!existing) {
      existing = await db.marketingstrategies.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Marketing strategy not found')
    }

    const updated: MarketingStrategyRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.marketingstrategies.put(updated)

    await enqueueMutation('marketingstrategies', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateMarketingStrategyInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const marketingStrategy: MarketingStrategyRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.marketingstrategies.put(marketingStrategy)

    await enqueueMutation('marketingstrategies', 'create', {
      ...data,
      optimisticId
    })

    return marketingStrategy
  },
  delete: async (id: string) => {
    let existing = await db.marketingstrategies.get(id)

    if (!existing) {
      existing = await db.marketingstrategies.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Marketing strategy not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.marketingstrategies.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('marketingstrategies')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('marketingstrategies', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
