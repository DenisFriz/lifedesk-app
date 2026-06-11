import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useRecurringExpensesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['recurringexpenses'],
    queryFn: async () => {
      const recurringexpenses = await db.recurringexpenses.toArray()

      return recurringexpenses
        .filter(expense => !expense.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
