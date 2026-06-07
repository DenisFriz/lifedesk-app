import { useSound } from '@/contexts/SoundContext'
import { MarketingContentRecord } from '@/db'
import {
  CreateMarketingContentInput,
  marketingContentRepository
} from '@/repositories/marketing-content.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMarketingContentMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MarketingContentRecord> }) =>
      marketingContentRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingcontents'] })
    }
  })

  const createMutation = useMutation<any, any, CreateMarketingContentInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return marketingContentRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingcontents'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return marketingContentRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingcontents'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
