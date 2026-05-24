import { useSound } from '@/contexts/SoundContext'
import { EventRecord } from '@/db'
import { eventRepository } from '@/repositories/event.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useEventMutations() {
  const queryClient = useQueryClient()
  const { playSound } = useSound()

  const updateMutation = useMutation<any, any, { id: string; data: Record<string, any> }>({
    networkMode: 'always',
    mutationFn: ({ id, data }) => eventRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['events'] })
      const previousEvents = queryClient.getQueryData(['events'])
      queryClient.setQueryData(['events'], (old: any) =>
        old.map((event: any) => (event.id === id ? { ...event, ...data } : event))
      )
      return { previousEvents }
    },
    onError: (err, variables, context: any) => {
      queryClient.setQueryData(['events'], context.previousEvents)
    },
    onSuccess: (updatedEvent, { id, data }) => {
      if ('category' in data || 'business_id' in data) {
        queryClient.invalidateQueries({ queryKey: ['events'] })
      } else {
        queryClient.setQueryData(['events'], (old: any) =>
          old ? old.map((event: any) => (event.id === id ? updatedEvent : event)) : old
        )
      }
    }
  })

  const createMutation = useMutation<any, any, Record<string, any>>({
    networkMode: 'always',
    mutationFn: async (data: EventRecord) => {
      return eventRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: ['events'] })
      const previousEvents = queryClient.getQueryData<any[]>(['events']) ?? []
      queryClient.setQueryData(
        ['events'],
        [
          {
            ...data,
            id: `optimistic-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            is_deleted: false
          },
          ...previousEvents
        ]
      )
      return { previousEvents }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousEvents) queryClient.setQueryData(['events'], context.previousEvents)
    }
  })

  const deleteMutation = useMutation<void, any, string>({
    networkMode: 'always',
    mutationFn: id => {
      playSound('delete')
      return eventRepository.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const duplicateMutation = useMutation<any, any, Record<string, any>>({
    networkMode: 'always',
    mutationFn: eventRepository.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkDeleteMutation = useMutation<void, any, string[]>({
    networkMode: 'always',
    mutationFn: async ids => {
      playSound('delete')
      await eventRepository.bulkDelete(ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: Record<string, any> }>({
    networkMode: 'always',
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playSound('archived')
      }
      await eventRepository.bulkUpdate(ids, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation,
    bulkUpdateMutation
  }
}
