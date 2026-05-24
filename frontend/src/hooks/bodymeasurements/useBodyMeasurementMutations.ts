import { useSound } from '@/contexts/SoundContext'
import { BodyMeasurementRecord } from '@/db'
import {
  bodyMeasurementRepository,
  CreateBodyMeasurementInput
} from '@/repositories/bodymeasurement.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useBodyMeasurementMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BodyMeasurementRecord> }) =>
      bodyMeasurementRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodymeasurements'] })
    }
  })

  const createMutation = useMutation<any, any, CreateBodyMeasurementInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return bodyMeasurementRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodymeasurements'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return bodyMeasurementRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bodymeasurements'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
