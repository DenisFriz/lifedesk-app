import { useSound } from '@/contexts/SoundContext'
import { RecurringIncomeRecord } from '@/db'
import {
  CreateRecurringIncomeInput,
  recurringIncomeRepository
} from '@/repositories/recurring-income.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useRecurringIncomesMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringIncomeRecord> }) =>
      recurringIncomeRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringincomes'] })
    }
  })

  const createMutation = useMutation<any, any, CreateRecurringIncomeInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return recurringIncomeRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringincomes'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return recurringIncomeRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringincomes'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
