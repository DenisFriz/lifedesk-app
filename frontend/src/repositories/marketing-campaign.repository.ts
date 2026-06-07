import { db, MarketingCampaignRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateMarketingCampaignInput = Omit<
  MarketingCampaignRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const marketingCampaignRepository = {
  update: async (id: string, data: Partial<MarketingCampaignRecord>) => {
    let existing = await db.marketingcampaigns.get(id)

    if (!existing) {
      existing = await db.marketingcampaigns.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Marketing campaign not found')
    }

    const updated: MarketingCampaignRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.marketingcampaigns.put(updated)

    await enqueueMutation('marketingcampaigns', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateMarketingCampaignInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const marketingCampaign: MarketingCampaignRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.marketingcampaigns.put(marketingCampaign)

    await enqueueMutation('marketingcampaigns', 'create', {
      ...data,
      optimisticId
    })

    return marketingCampaign
  },
  delete: async (id: string) => {
    let existing = await db.marketingcampaigns.get(id)

    if (!existing) {
      existing = await db.marketingcampaigns.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Marketing campaign not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.marketingcampaigns.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('marketingcampaigns')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('marketingcampaigns', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
