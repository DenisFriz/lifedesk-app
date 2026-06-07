import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useOfflineAccountsQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['offlineaccounts'],
    queryFn: async () => {
      const offlineAccounts = await db.offlineaccounts.toArray()

      return offlineAccounts
        .filter(offlineAccount => !offlineAccount.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
