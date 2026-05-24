import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseGoalsQueryProps = {
  enabled?: boolean
  category?: string
}

export const useGoalsQuery = ({ enabled, category }: UseGoalsQueryProps = {}) => {
  return useQuery({
    queryKey: ['goals', category],
    queryFn: async () => {
      const goals = await db.goals.toArray()

      return goals
        .filter(goal => !goal.is_deleted)
        .filter(goal => {
          if (!category) return true

          return goal.category === category
        })
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
