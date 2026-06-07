import { useSound } from '@/contexts/SoundContext'
import { taskRepository } from '@/repositories/task.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useTaskMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation<any, any, { id: string; data: any }>({
    networkMode: 'always',
    mutationFn: ({ id, data }) => taskRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData(['tasks'])
      queryClient.setQueryData(['tasks'], (oldTasks: any) => {
        if (!oldTasks) return oldTasks
        return oldTasks.map((task: any) =>
          task.id === id || task.serverId === id ? { ...task, ...data } : task
        )
      })
      return { previousTasks }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    }
  })

  const createMutation = useMutation<any, any, any>({
    networkMode: 'always',
    mutationFn: async data => {
      return taskRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const previousTasks = queryClient.getQueryData<any[]>(['tasks']) ?? []
      queryClient.setQueryData(
        ['tasks'],
        [
          {
            ...data,
            id: `optimistic-${Date.now()}`,
            description: data.description ?? '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            is_deleted: false
          },
          ...previousTasks
        ]
      )
      return { previousTasks }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks)
      }
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return taskRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const duplicateMutation = useMutation<any, any, any>({
    networkMode: 'always',
    mutationFn: taskRepository.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    networkMode: 'always',
    mutationFn: async ids => {
      playSound('delete')
      await taskRepository.bulkDelete(ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: any }>({
    networkMode: 'always',
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playSound('archived')
      }
      await taskRepository.bulkUpdate(ids, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation,
    bulkUpdateMutation
  }
}
