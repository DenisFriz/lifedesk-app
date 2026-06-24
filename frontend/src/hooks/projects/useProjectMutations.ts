import { useSound } from '@/contexts/SoundContext'
import { ProjectRecord } from '@/db'
import { CreateProjectInput, projectRepository } from '@/repositories/project.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useProjectMutations(businessId?: string | null) {
  const queryClient = useQueryClient()
  const { playSound } = useSound()
  const queryKey = ['projects', businessId ?? undefined] as const

  const updateMutation = useMutation<any, any, { id: string; data: Partial<ProjectRecord> }>({
    networkMode: 'always',
    mutationFn: ({ id, data }) => projectRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousProjects = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldProjects: any) => {
        if (!oldProjects) return oldProjects
        return oldProjects.map((project: any) =>
          project.id === id || project.serverId === id ? { ...project, ...data } : project
        )
      })
      return { previousProjects }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKey, context.previousProjects)
      }
    }
  })

  const createMutation = useMutation<any, any, CreateProjectInput>({
    networkMode: 'always',
    mutationFn: async (data: CreateProjectInput) => {
      return projectRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey })
      const previousProjects = queryClient.getQueryData<any[]>(queryKey) ?? []
      const tempId = `optimistic-${Date.now()}`
      queryClient.setQueryData(queryKey, [
        {
          ...data,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          is_deleted: false
        },
        ...previousProjects
      ])
      return { previousProjects, tempId }
    },
    onSuccess: (createdProject, _variables, context: any) => {
      queryClient.setQueryData(queryKey, (oldProjects: any) => {
        if (!oldProjects) return oldProjects
        return oldProjects.map((project: any) =>
          project.id === context?.tempId ? createdProject : project
        )
      })
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProjects) queryClient.setQueryData(queryKey, context.previousProjects)
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: async id => {
      playSound('delete')
      return projectRepository.delete(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey })
      const previousProjects = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldProjects: any) => {
        if (!oldProjects) return oldProjects
        return oldProjects.filter((p: any) => p.id !== id && p.serverId !== id)
      })
      return { previousProjects }
    },
    onError: (err, id, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKey, context.previousProjects)
      }
    }
  })

  /*   const duplicateMutation = useMutation<any, any, Record<string, any>>({
    networkMode: 'always',
    mutationFn: projectRepository.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })
 */
  const bulkDeleteMutation = useMutation<void, any, string[]>({
    networkMode: 'always',
    mutationFn: async ids => {
      playSound('delete')
      await projectRepository.bulkDelete(ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: Record<string, any> }>({
    networkMode: 'always',
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playSound('archived')
      }
      await projectRepository.bulkUpdate(ids, data)
    },
    onMutate: async ({ ids, data }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousProjects = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldProjects: any) => {
        if (!oldProjects) return oldProjects
        return oldProjects.map((project: any) =>
          ids.includes(project.id) ? { ...project, ...data } : project
        )
      })
      return { previousProjects }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(queryKey, context.previousProjects)
      }
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation,
    bulkDeleteMutation,
    bulkUpdateMutation
  }
}
