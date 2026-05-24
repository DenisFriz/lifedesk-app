import { useSound } from '@/contexts/SoundContext'
import { GoalCreateInput, goalRepository } from '@/repositories/goal.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useGoalMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation<any, any, { id: string; data: Record<string, any> }>({
    networkMode: 'always',
    mutationFn: ({ id, data }) => goalRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData(['goals'])
      queryClient.setQueryData(['goals'], (oldGoals: any) => {
        if (!oldGoals) return oldGoals
        return oldGoals.map((goal: any) =>
          goal.id === id || goal.serverId === id ? { ...goal, ...data } : goal
        )
      })
      return { previousGoals }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals)
      }
    }
  })

  const createMutation = useMutation<any, any, GoalCreateInput>({
    networkMode: 'always',
    mutationFn: async (data: GoalCreateInput) => {
      return goalRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData<any[]>(['goals']) ?? []
      queryClient.setQueryData(
        ['goals'],
        [
          {
            ...data,
            id: `optimistic-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            is_deleted: false
          },
          ...previousGoals
        ]
      )
      return { previousGoals }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousGoals) queryClient.setQueryData(['goals'], context.previousGoals)
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: async id => {
      playSound('delete')
      return goalRepository.delete(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData(['goals'])
      queryClient.setQueryData(['goals'], (oldGoals: any) => {
        if (!oldGoals) return oldGoals
        return oldGoals.filter((g: any) => g._id !== id && g.id !== id)
      })
      return { previousGoals }
    },
    onError: (err, id, context: any) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const duplicateMutation = useMutation<any, any, Record<string, any>>({
    networkMode: 'always',
    mutationFn: goalRepository.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    networkMode: 'always',
    mutationFn: async ids => {
      playSound('delete')
      await goalRepository.bulkDelete(ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: Record<string, any> }>({
    networkMode: 'always',
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playSound('archived')
      }
      await goalRepository.bulkUpdate(ids, data)
    },
    onMutate: async ({ ids, data }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      const previousGoals = queryClient.getQueryData(['goals'])
      queryClient.setQueryData(['goals'], (oldGoals: any) => {
        if (!oldGoals) return oldGoals
        return oldGoals.map((goal: any) => (ids.includes(goal._id) ? { ...goal, ...data } : goal))
      })
      return { previousGoals }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(['goals'], context.previousGoals)
      }
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
