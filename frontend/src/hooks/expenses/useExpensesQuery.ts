import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useExpensesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const expenses = await db.expenses.toArray()

      return expenses
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
