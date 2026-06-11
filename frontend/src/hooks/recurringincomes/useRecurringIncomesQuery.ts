import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useRecurringIncomesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['recurringincomes'],
    queryFn: async () => {
      const recurringincomes = await db.recurringincomes.toArray()

      return recurringincomes
        .filter(income => !income.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
