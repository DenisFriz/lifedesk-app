import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

interface UseProjectsQueryProps {
  businessId?: string
  enabled?: boolean
}

export const useProjectsQuery = ({ businessId, enabled = true }: UseProjectsQueryProps = {}) => {
  return useQuery({
    queryKey: ['projects', businessId],

    queryFn: async () => {
      const projects = businessId
        ? await db.projects.where('business_id').equals(businessId).toArray()
        : await db.projects.toArray()

      return projects
        .filter(project => !project.is_deleted)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
