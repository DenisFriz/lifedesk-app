import { useSound } from '@/contexts/SoundContext'
import { ProblemRecord } from '@/db'
import { CreateProblemInput, problemRepository } from '@/repositories/problem.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useProblemMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProblemRecord> }) =>
      problemRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] })
    }
  })

  const createMutation = useMutation<any, any, CreateProblemInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return problemRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return problemRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['problems'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
