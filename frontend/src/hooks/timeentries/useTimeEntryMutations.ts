import { useSound } from '@/contexts/SoundContext'
import { TimeEntryRecord } from '@/db'
import { CreateTimeEntryInput, timeEntryRepository } from '@/repositories/timeentry.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useTimeEntryMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TimeEntryRecord> }) =>
      timeEntryRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeentries'] })
    }
  })

  const createMutation = useMutation<any, any, CreateTimeEntryInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return timeEntryRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeentries'] })
      queryClient.invalidateQueries({ queryKey: ['runningTimeEntry'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return timeEntryRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeentries'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
