import { useSound } from '@/contexts/SoundContext'
import { OtherAssetRecord } from '@/db'
import { CreateOtherAssetInput, otherAssetRepository } from '@/repositories/otherasset.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useOtherAssetMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OtherAssetRecord> }) =>
      otherAssetRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherassets'] })
    }
  })

  const createMutation = useMutation<any, any, CreateOtherAssetInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return otherAssetRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherassets'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return otherAssetRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['otherassets'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
