import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

export const useVehiclesQuery = (enabled?: boolean) => {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const vehicles = await db.vehicles.toArray()

      return vehicles
        .filter(vehicle => !vehicle.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
