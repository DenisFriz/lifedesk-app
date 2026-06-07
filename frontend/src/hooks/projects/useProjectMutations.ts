import { useSound } from '@/contexts/SoundContext'
import { ProjectRecord } from '@/db'
import { CreateProjectInput, projectRepository } from '@/repositories/project.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useProjectMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation<any, any, { id: string; data: Partial<ProjectRecord> }>({
    networkMode: 'always',
    mutationFn: ({ id, data }) => projectRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previousProjects = queryClient.getQueryData(['projects'])
      queryClient.setQueryData(['projects'], (oldProjects: any) => {
        if (!oldProjects) return oldProjects
        return oldProjects.map((project: any) =>
          project.id === id || project.serverId === id ? { ...project, ...data } : project
        )
      })
      return { previousProjects }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
    }
  })

  const createMutation = useMutation<any, any, CreateProjectInput>({
    networkMode: 'always',
    mutationFn: async (data: CreateProjectInput) => {
      return projectRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previousProjects = queryClient.getQueryData<any[]>(['projects']) ?? []
      queryClient.setQueryData(
        ['projects'],
        [
          {
            ...data,
            id: `optimistic-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            is_deleted: false
          },
          ...previousProjects
        ]
      )
      return { previousProjects }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProjects)
        queryClient.setQueryData(['projects'], context.previousProjects)
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: async id => {
      playSound('delete')
      return projectRepository.delete(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previousProjects = queryClient.getQueryData(['projects'])
      queryClient.setQueryData(['projects'], (oldProjects: any) => {
        if (!oldProjects) return oldProjects
        return oldProjects.filter((p: any) => p.id !== id && p.serverId !== id)
      })
      return { previousProjects }
    },
    onError: (err, id, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
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
      queryClient.invalidateQueries({ queryKey: ['projects'] })
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
      await queryClient.cancelQueries({ queryKey: ['projects'] })
      const previousProjects = queryClient.getQueryData(['projects'])
      queryClient.setQueryData(['projects'], (oldProjects: any) => {
        if (!oldProjects) return oldProjects
        return oldProjects.map((project: any) =>
          ids.includes(project.id) ? { ...project, ...data } : project
        )
      })
      return { previousProjects }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
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
