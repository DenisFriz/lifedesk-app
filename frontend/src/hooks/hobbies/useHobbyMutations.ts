import { useSound } from '@/contexts/SoundContext'
import { HobbyRecord } from '@/db'
import { CreateHobbyInput, hobbyRepository } from '@/repositories/hobby.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useHobbyMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HobbyRecord> }) =>
      hobbyRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hobbies'] })
    }
  })

  const createMutation = useMutation<any, any, CreateHobbyInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return hobbyRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hobbies'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return hobbyRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hobbies'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
