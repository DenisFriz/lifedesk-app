import { useSound } from '@/contexts/SoundContext'
import { RecurringExpenseRecord } from '@/db'
import {
  CreateRecurringExpenseInput,
  recurringExpenseRepository
} from '@/repositories/recurring-exprense.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useRecurringExpenseMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RecurringExpenseRecord> }) =>
      recurringExpenseRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringexpenses'] })
    }
  })

  const createMutation = useMutation<any, any, CreateRecurringExpenseInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return recurringExpenseRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringexpenses'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return recurringExpenseRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringexpenses'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
