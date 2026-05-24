import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useEstatesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['estates'],
    queryFn: async () => {
      const estates = await db.estates.toArray()

      return estates
        .filter(estate => !estate.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
