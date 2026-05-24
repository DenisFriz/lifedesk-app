import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseWorkoutPlansQueryProps = {
  enabled?: boolean
}

export const useWorkoutPlansQuery = ({ enabled }: UseWorkoutPlansQueryProps = {}) => {
  return useQuery({
    queryKey: ['workoutplans'],
    queryFn: async () => {
      const workoutplans = await db.workoutplans.toArray()

      return workoutplans
        .filter(workoutplan => !workoutplan.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
