import { useSound } from '@/contexts/SoundContext'
import { EstateRecord } from '@/db'
import { CreateEstateInput, estateRepository } from '@/repositories/estate.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useEstateMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EstateRecord> }) =>
      estateRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estates'] })
    }
  })

  const createMutation = useMutation<any, any, CreateEstateInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return estateRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estates'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return estateRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estates'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
