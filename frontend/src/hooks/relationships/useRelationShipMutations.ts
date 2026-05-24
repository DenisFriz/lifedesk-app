import { useSound } from '@/contexts/SoundContext'
import { RelationShipRecord } from '@/db'
import {
  CreateRelationShipInput,
  relationShipRepository
} from '@/repositories/relationships.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useRelationShipMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RelationShipRecord> }) =>
      relationShipRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
    }
  })

  const createMutation = useMutation<any, any, CreateRelationShipInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return relationShipRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return relationShipRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationships'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
