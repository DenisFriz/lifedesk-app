import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useNotesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const notes = await db.notes.toArray()

      return notes
        .filter(note => !note.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
