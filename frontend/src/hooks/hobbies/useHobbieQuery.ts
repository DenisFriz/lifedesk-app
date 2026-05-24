import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseHobbiesQueryProps = {
  enabled?: boolean
}

export const useHobbiesQuery = ({ enabled }: UseHobbiesQueryProps = {}) => {
  return useQuery({
    queryKey: ['hobbies'],
    queryFn: async () => {
      const hobbies = await db.hobbies.toArray()

      return hobbies
        .filter(hobby => !hobby.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
