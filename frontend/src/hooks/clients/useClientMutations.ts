import { useSound } from '@/contexts/SoundContext'
import { ClientRecord } from '@/db'
import { clientRepository, CreateClientInput } from '@/repositories/client.repository'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export function useClientMutations(businessId?: string) {
  const queryClient = useQueryClient()
  const { playSound } = useSound()
  const clientsKey = ['clients', businessId] as const

  const updateMutation = useMutation<any, any, { id: string; data: Partial<ClientRecord> }>({
    networkMode: 'always',
    mutationFn: ({ id, data }) => clientRepository.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: clientsKey })
      const previousClients = queryClient.getQueryData(clientsKey)
      queryClient.setQueryData(clientsKey, (oldClients: any) => {
        if (!oldClients) return oldClients
        return oldClients.map((client: any) =>
          client.id === id || client.serverId === id ? { ...client, ...data } : client
        )
      })
      return { previousClients }
    },
    onError: (err, variables, context: any) => {
      if (context?.previousClients) {
        queryClient.setQueryData(clientsKey, context.previousClients)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey })
    }
  })

  const createMutation = useMutation<any, any, CreateClientInput>({
    networkMode: 'always',
    mutationFn: async (data: CreateClientInput) => {
      return clientRepository.create(data)
    },
    onMutate: async data => {
      await queryClient.cancelQueries({ queryKey: clientsKey })
      const previousClients = queryClient.getQueryData<any[]>(clientsKey) ?? []
      queryClient.setQueryData(clientsKey, [
        {
          ...data,
          id: `optimistic-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          is_deleted: false
        },
        ...previousClients
      ])
      return { previousClients }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousClients) queryClient.setQueryData(clientsKey, context.previousClients)
    }
  })

  const deleteMutation = useMutation<any, any, string>({
    networkMode: 'always',
    mutationFn: async id => {
      playSound('delete')
      return clientRepository.delete(id)
    },
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: clientsKey })
      const previousClients = queryClient.getQueryData(clientsKey)
      queryClient.setQueryData(clientsKey, (oldClients: any) => {
        if (!oldClients) return oldClients
        return oldClients.filter((c: any) => c.id !== id && c.serverId !== id)
      })
      return { previousClients }
    },
    onError: (err, id, context: any) => {
      if (context?.previousClients) {
        queryClient.setQueryData(clientsKey, context.previousClients)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey })
    }
  })

  /*   const duplicateMutation = useMutation<any, any, Record<string, any>>({
    networkMode: 'always',
    mutationFn: projectRepository.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })
 */
  const bulkDeleteMutation = useMutation<void, any, string[]>({
    networkMode: 'always',
    mutationFn: async ids => {
      playSound('delete')
      await clientRepository.bulkDelete(ids)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey })
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    }
  })

  const bulkUpdateMutation = useMutation<void, any, { ids: string[]; data: Record<string, any> }>({
    networkMode: 'always',
    mutationFn: async ({ ids, data }) => {
      if (data.status === 'archived') {
        playSound('archived')
      }
      await clientRepository.bulkUpdate(ids, data)
    },
    onMutate: async ({ ids, data }) => {
      await queryClient.cancelQueries({ queryKey: clientsKey })
      const previousClients = queryClient.getQueryData(clientsKey)
      queryClient.setQueryData(clientsKey, (oldClients: any) => {
        if (!oldClients) return oldClients
        return oldClients.map((client: any) =>
          ids.includes(client.id) ? { ...client, ...data } : client
        )
      })
      return { previousClients }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientsKey })
    },
    onError: (err, variables, context: any) => {
      if (context?.previousClients) {
        queryClient.setQueryData(clientsKey, context.previousClients)
      }
    }
  })

  return {
    updateMutation,
    createMutation,
    deleteMutation,
    bulkDeleteMutation,
    bulkUpdateMutation
  }
}
