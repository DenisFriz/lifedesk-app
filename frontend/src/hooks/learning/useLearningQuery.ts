import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useLearningQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['learning'],
    queryFn: async () => {
      const learningItems = await db.learning.toArray()

      return learningItems
        .filter(item => !item.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
