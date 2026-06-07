import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useMarketingContentsQuery = (businessId?: string, enabled?: boolean) => {
  return useQuery({
    queryKey: ['marketingcontents', businessId],
    queryFn: async () => {
      const marketingContents = await db.marketingcontents.toArray()

      return marketingContents
        .filter(marketingContent => {
          if (marketingContent.is_deleted) return false

          return businessId ? marketingContent.business_id === businessId : true
        })
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
