import { backend } from '@/api/backend'
import { CommunityIdeaRecord } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useCommunityIdeasQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['communityideas'],
    queryFn: async () => {
      const records = (await backend.entities.CommunityIdea.list()) as any[]

      return records
        .map(r => ({ ...r, id: String(r._id) }) as CommunityIdeaRecord)
        .filter(idea => !idea.is_deleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
