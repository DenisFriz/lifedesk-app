import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useCommunityIdeasQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['communityideas'],
    queryFn: async () => {
      const communityideas = await db.communityideas.toArray()

      return communityideas
        .filter(idea => !idea.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
