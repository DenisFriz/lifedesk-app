import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useOtherAssetsQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['otherassets'],
    queryFn: async () => {
      const otherAssets = await db.otherassets.toArray()

      return otherAssets
        .filter(otherAsset => !otherAsset.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
