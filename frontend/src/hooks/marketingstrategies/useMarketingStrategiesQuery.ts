import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

interface UseMarketingStrategiesQueryProps {
  businessId?: string
  enabled?: boolean
}

export const useMarketingStrategiesQuery = ({
  businessId,
  enabled = true
}: UseMarketingStrategiesQueryProps = {}) => {
  return useQuery({
    queryKey: ['marketingstrategies', businessId],

    queryFn: async () => {
      const marketingStrategies = businessId
        ? await db.marketingstrategies.where('business_id').equals(businessId).toArray()
        : await db.marketingstrategies.toArray()

      return marketingStrategies
        .filter(strategy => !strategy.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
