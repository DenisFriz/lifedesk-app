import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseBusinessesQueryProps = {
  enabled?: boolean
}

export const useBusinessesQuery = ({ enabled }: UseBusinessesQueryProps = {}) => {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const businesses = await db.businesses.toArray()

      return businesses
        .filter(business => !business.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        .map(business => ({
          ...business,
          id: business.id || (business as any)._id
        }))
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
