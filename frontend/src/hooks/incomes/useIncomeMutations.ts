import { useSound } from '@/contexts/SoundContext'
import { IncomeRecord } from '@/db'
import { CreateIncomeInput, incomeRepository } from '@/repositories/income.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useIncomeMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IncomeRecord> }) =>
      incomeRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] })
    }
  })

  const createMutation = useMutation<any, any, CreateIncomeInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return incomeRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return incomeRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
