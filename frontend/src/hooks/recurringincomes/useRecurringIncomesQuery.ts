import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseRecurringIncomesQueryParams = {
  businessId?: string
  enabled?: boolean
}

export const useRecurringIncomesQuery = ({
  businessId,
  enabled
}: UseRecurringIncomesQueryParams = {}) => {
  return useQuery({
    queryKey: ['recurringincomes', businessId],
    queryFn: async () => {
      const recurringincomes = businessId
        ? await db.recurringincomes.where('business_id').equals(businessId).toArray()
        : await db.recurringincomes.toArray()

      return recurringincomes
        .filter(income => !income.is_deleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
