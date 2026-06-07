import { useSound } from '@/contexts/SoundContext'
import { ExpenseRecord } from '@/db'
import { CreateExpenseInput, expenseRepository } from '@/repositories/expense.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useExpenseMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExpenseRecord> }) =>
      expenseRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })

  const createMutation = useMutation<any, any, CreateExpenseInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return expenseRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return expenseRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
