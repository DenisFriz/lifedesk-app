import { useSound } from '@/contexts/SoundContext'
import { BusinessRecord } from '@/db'
import { businessRepository, CreateBusinessInput } from '@/repositories/business.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useBusinessMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BusinessRecord> }) =>
      businessRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    }
  })

  const createMutation = useMutation<any, any, CreateBusinessInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return businessRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return businessRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
