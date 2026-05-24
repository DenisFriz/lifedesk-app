import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useRelationShipsQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['relationships'],
    queryFn: async () => {
      const relationShips = await db.relationships.toArray()

      return relationShips
        .filter(relationShip => !relationShip.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
