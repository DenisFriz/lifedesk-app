import { useSound } from '@/contexts/SoundContext'
import { CommunityIdeaRecord } from '@/db'
import {
  communityIdeaRepository,
  CreateCommunityIdeaInput
} from '@/repositories/community-idea.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useCommunityIdeaMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommunityIdeaRecord> }) =>
      communityIdeaRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityideas'] })
    }
  })

  const createMutation = useMutation<any, any, CreateCommunityIdeaInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return communityIdeaRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityideas'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return communityIdeaRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communityideas'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
