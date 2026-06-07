import { useSound } from '@/contexts/SoundContext'
import { MedicalDocumentRecord } from '@/db'
import {
  CreateMedicalDocumentInput,
  medicalDocumentRepository
} from '@/repositories/medicaldocument.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useMedicalDocumentMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MedicalDocumentRecord> }) =>
      medicalDocumentRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicaldocuments'] })
    }
  })

  const createMutation = useMutation<any, any, CreateMedicalDocumentInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return medicalDocumentRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicaldocuments'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return medicalDocumentRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicaldocuments'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
