import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useOfflineAccountSnapshotsQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['offlineaccountSnapshots'],
    queryFn: async () => {
      const offlineAccountSnapshots = await db.offlineaccountSnapshots.toArray()

      return offlineAccountSnapshots
        .filter(snapshot => !snapshot.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
