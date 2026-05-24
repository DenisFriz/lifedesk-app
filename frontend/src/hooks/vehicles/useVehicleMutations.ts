import { useSound } from '@/contexts/SoundContext'
import { VehicleRecord } from '@/db'
import { CreateVehicleInput, vehicleRepository } from '@/repositories/vehicle.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useVehicleMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VehicleRecord> }) =>
      vehicleRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    }
  })

  const createMutation = useMutation<any, any, CreateVehicleInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return vehicleRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return vehicleRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
