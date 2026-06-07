import { useSound } from '@/contexts/SoundContext'
import { OfflineAccountRecord } from '@/db'
import {
  CreateOfflineAccountInput,
  offlineAccountRepository
} from '@/repositories/offline-account.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useOfflineAccountMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OfflineAccountRecord> }) =>
      offlineAccountRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineaccounts'] })
    }
  })

  const createMutation = useMutation<any, any, CreateOfflineAccountInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return offlineAccountRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineaccounts'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return offlineAccountRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineaccounts'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
