import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

interface UseMarketingCampaignsQueryProps {
  businessId?: string
  enabled?: boolean
}

export const useMarketingCampaignsQuery = ({
  businessId,
  enabled = true
}: UseMarketingCampaignsQueryProps = {}) => {
  return useQuery({
    queryKey: ['marketingcampaigns', businessId],

    queryFn: async () => {
      const marketingCampaigns = businessId
        ? await db.marketingcampaigns.where('business_id').equals(businessId).toArray()
        : await db.marketingcampaigns.toArray()

      return marketingCampaigns
        .filter(campaign => !campaign.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
