import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseRecurringExpensesQueryParams = {
  businessId?: string
  enabled?: boolean
}

export const useRecurringExpensesQuery = ({
  businessId,
  enabled
}: UseRecurringExpensesQueryParams = {}) => {
  return useQuery({
    queryKey: ['recurringexpenses', businessId],
    queryFn: async () => {
      const recurringexpenses = businessId
        ? await db.recurringexpenses.where('business_id').equals(businessId).toArray()
        : await db.recurringexpenses.toArray()

      return recurringexpenses
        .filter(expense => !expense.is_deleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
