import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useEventsQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const events = await db.events.toArray()

      return events
        .filter(event => !event.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
