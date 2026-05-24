import { useSound } from '@/contexts/SoundContext'
import { LearningRecord } from '@/db'
import { CreateLearningInput, learningRepository } from '@/repositories/learning.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useLearningMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LearningRecord> }) =>
      learningRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] })
    }
  })

  const createMutation = useMutation<any, any, CreateLearningInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return learningRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return learningRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
