import { useSound } from '@/contexts/SoundContext'
import { NoteRecord } from '@/db'
import { CreatNoteInput, noteRepository } from '@/repositories/note.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useNoteMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NoteRecord> }) =>
      noteRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const createMutation = useMutation<any, any, CreatNoteInput>({
    networkMode: 'always',
    mutationFn: async data => {
      return noteRepository.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return noteRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation
  }
}
