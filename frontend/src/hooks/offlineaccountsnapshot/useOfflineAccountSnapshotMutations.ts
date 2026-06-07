import { useSound } from '@/contexts/SoundContext'
import { OfflineAccountSnapshotRecord } from '@/db'
import {
  CreateOfflineAccountSnapshotInput,
  offlineAccountSnapshotRepository
} from '@/repositories/offline-account-snapshot.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useOfflineAccountSnapshotMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OfflineAccountSnapshotRecord> }) =>
      offlineAccountSnapshotRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineaccountSnapshots'] })
    }
  })

  const createMutation = useMutation<any, any, CreateOfflineAccountSnapshotInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return offlineAccountSnapshotRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineaccountSnapshots'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return offlineAccountSnapshotRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offlineaccountSnapshots'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
