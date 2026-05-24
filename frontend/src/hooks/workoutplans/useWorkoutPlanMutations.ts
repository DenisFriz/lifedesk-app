import { useSound } from '@/contexts/SoundContext'
import { WorkoutPlanRecord } from '@/db'
import {
  CreateWorkoutPlanInput,
  workoutPlanRepository
} from '@/repositories/workoutplan.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useWorkoutPlanMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkoutPlanRecord> }) =>
      workoutPlanRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutplans'] })
    }
  })

  const createMutation = useMutation<any, any, CreateWorkoutPlanInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return workoutPlanRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutplans'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return workoutPlanRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workoutplans'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
