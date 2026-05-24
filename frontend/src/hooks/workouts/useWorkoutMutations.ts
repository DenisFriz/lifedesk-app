import { useSound } from '@/contexts/SoundContext'
import { WorkoutRecord } from '@/db'
import { CreateWorkoutInput, workoutRepository } from '@/repositories/workout.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useWorkoutMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkoutRecord> }) =>
      workoutRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
    }
  })

  const createMutation = useMutation<any, any, CreateWorkoutInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return workoutRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return workoutRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
