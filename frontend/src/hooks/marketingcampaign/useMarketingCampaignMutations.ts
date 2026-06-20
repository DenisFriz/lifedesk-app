import { useSound } from '@/contexts/SoundContext'
import { MarketingCampaignRecord } from '@/db'
import {
  CreateMarketingCampaignInput,
  marketingCampaignRepository
} from '@/repositories/marketing-campaign.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMarketingCampaignMutations(businessId?: string | null) {
  const queryClient = useQueryClient()
  const { playSound } = useSound()
  const queryKey = ['marketingcampaigns', businessId ?? undefined] as const

  const updateMutation = useMutation({
    networkMode: 'always',
    mutationFn: ({ id, data }: { id: string; data: Partial<MarketingCampaignRecord> }) =>
      marketingCampaignRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey })
      const previousCampaigns = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldCampaigns: any) => {
        if (!oldCampaigns) return oldCampaigns
        return oldCampaigns.map((campaign: any) =>
          campaign.id === id ? { ...campaign, ...data } : campaign
        )
      })
      return { previousCampaigns }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(queryKey, context.previousCampaigns)
      }
    }
  })

  const createMutation = useMutation<any, any, CreateMarketingCampaignInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return marketingCampaignRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey })
      const previousCampaigns = queryClient.getQueryData<any[]>(queryKey) ?? []
      queryClient.setQueryData(queryKey, [
        {
          ...data,
          id: `optimistic-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          is_deleted: false
        },
        ...previousCampaigns
      ])
      return { previousCampaigns }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(queryKey, context.previousCampaigns)
      }
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return marketingCampaignRepository.delete(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey })
      const previousCampaigns = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (oldCampaigns: any) => {
        if (!oldCampaigns) return oldCampaigns
        return oldCampaigns.filter((c: any) => c.id !== id)
      })
      return { previousCampaigns }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, id, context: any) => {
      if (context?.previousCampaigns) {
        queryClient.setQueryData(queryKey, context.previousCampaigns)
      }
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
