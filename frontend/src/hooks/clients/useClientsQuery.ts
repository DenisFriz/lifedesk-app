import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

interface UseClientsQueryProps {
  businessId?: string
  enabled?: boolean
}

export const useClientsQuery = ({ businessId, enabled = true }: UseClientsQueryProps = {}) => {
  return useQuery({
    queryKey: ['clients', businessId],

    queryFn: async () => {
      const clients = businessId
        ? await db.clients.where('business_id').equals(businessId).toArray()
        : await db.clients.toArray()

      return clients
        .filter(client => !client.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
