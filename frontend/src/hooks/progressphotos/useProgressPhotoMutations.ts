import { useSound } from '@/contexts/SoundContext'
import { ProgressPhotoRecord } from '@/db'
import {
  CreateProgressPhotoInput,
  progressPhotosRepository
} from '@/repositories/progressphotos.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

type BulkUpdatePayload = {
  ids: string[]
  data: Partial<ProgressPhotoRecord>
}

export function useProgressPhotoMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const createMutation = useMutation<any, any, CreateProgressPhotoInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return progressPhotosRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressphotos'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return progressPhotosRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressphotos'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    networkMode: 'always',
    mutationFn: async ids => {
      playSound('delete')
      await progressPhotosRepository.bulkDelete(ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressphotos'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkUpdateMutation = useMutation<any, any, BulkUpdatePayload>({
    networkMode: 'always',
    mutationFn: ({ ids, data }) => progressPhotosRepository.bulkUpdate(ids, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressphotos'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    createMutation,
    deleteMutation,
    bulkDeleteMutation,
    bulkUpdateMutation
  }
}
