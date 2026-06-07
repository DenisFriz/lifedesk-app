import { useSound } from '@/contexts/SoundContext'
import { MarketingStrategyRecord } from '@/db'
import {
  CreateMarketingStrategyInput,
  marketingStrategyRepository
} from '@/repositories/marketing-strategy.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMarketingStrategyMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MarketingStrategyRecord> }) =>
      marketingStrategyRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingstrategies'] })
    }
  })

  const createMutation = useMutation<any, any, CreateMarketingStrategyInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return marketingStrategyRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingstrategies'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return marketingStrategyRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingstrategies'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
