import { useSound } from '@/contexts/SoundContext'
import { MarketingCampaignRecord } from '@/db'
import {
  CreateMarketingCampaignInput,
  marketingCampaignRepository
} from '@/repositories/marketing-campaign.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMarketingCampaignMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MarketingCampaignRecord> }) =>
      marketingCampaignRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingcampaigns'] })
    }
  })

  const createMutation = useMutation<any, any, CreateMarketingCampaignInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return marketingCampaignRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingcampaigns'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return marketingCampaignRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketingcampaigns'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
