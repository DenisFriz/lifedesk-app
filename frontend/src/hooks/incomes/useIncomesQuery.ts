import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useIncomesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['incomes'],
    queryFn: async () => {
      const incomes = await db.incomes.toArray()

      return incomes
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
