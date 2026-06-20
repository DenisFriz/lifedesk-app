import { useSound } from '@/contexts/SoundContext'
import { MarketingStrategyRecord } from '@/db'
import {
  CreateMarketingStrategyInput,
  marketingStrategyRepository
} from '@/repositories/marketing-strategy.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMarketingStrategyMutations(businessId?: string | null) {
  const queryClient = useQueryClient()
  const { playSound } = useSound()
  const queryKey = ['marketingstrategies', businessId ?? undefined] as const

  const updateMutation = useMutation({
    networkMode: 'always',
    mutationFn: ({ id, data }: { id: string; data: Partial<MarketingStrategyRecord> }) =>
      marketingStrategyRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousStrategies = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldStrategies: any) => {
        if (!oldStrategies) return oldStrategies
        return oldStrategies.map((strategy: any) =>
          strategy.id === id ? { ...strategy, ...data } : strategy
        )
      })
      return { previousStrategies }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousStrategies) {
        queryClient.setQueryData(queryKey, context.previousStrategies)
      }
    }
  })

  const createMutation = useMutation<any, any, CreateMarketingStrategyInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return marketingStrategyRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey })
      const previousStrategies = queryClient.getQueryData<any[]>(queryKey) ?? []
      queryClient.setQueryData(queryKey, [
        {
          ...data,
          id: `optimistic-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          is_deleted: false
        },
        ...previousStrategies
      ])
      return { previousStrategies }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousStrategies) {
        queryClient.setQueryData(queryKey, context.previousStrategies)
      }
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return marketingStrategyRepository.delete(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey })
      const previousStrategies = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldStrategies: any) => {
        if (!oldStrategies) return oldStrategies
        return oldStrategies.filter((s: any) => s.id !== id)
      })
      return { previousStrategies }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, id, context: any) => {
      if (context?.previousStrategies) {
        queryClient.setQueryData(queryKey, context.previousStrategies)
      }
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
