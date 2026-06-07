import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useTimeEntriesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['timeentries'],
    queryFn: async () => {
      const timeEntries = await db.timeentries.toArray()

      return timeEntries
        .filter(timeEntry => !timeEntry.is_running)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
