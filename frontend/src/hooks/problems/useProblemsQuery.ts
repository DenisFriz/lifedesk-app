import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseProblemsQueryProps = {
  enabled?: boolean
  category?: string
}

export const useProblemsQuery = ({ enabled, category }: UseProblemsQueryProps = {}) => {
  return useQuery({
    queryKey: ['problems'],
    queryFn: async () => {
      const problems = await db.problems.toArray()

      return problems
        .filter(problem => !problem.is_deleted)
        .filter(problem => {
          if (!category) return true

          return problem.category === category
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
