import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseWorkoutsQueryProps = {
  enabled?: boolean
}

export const useWorkoutsQuery = ({ enabled }: UseWorkoutsQueryProps = {}) => {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: async () => {
      const workouts = await db.workouts.toArray()

      return workouts
        .filter(workout => !workout.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
