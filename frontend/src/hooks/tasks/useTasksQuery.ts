import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseTasksQueryProps = {
  enabled?: boolean
  category?: string
}

export const useTasksQuery = ({ enabled, category }: UseTasksQueryProps = {}) => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const tasks = await db.tasks.toArray()

      return tasks
        .filter(task => !task.is_deleted)
        .filter(task => {
          if (!category) return true

          return task.category === category
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
