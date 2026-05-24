import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseBodyMeasurementsQueryProps = {
  enabled?: boolean
}

export const useBodyMeasurementsQuery = ({ enabled }: UseBodyMeasurementsQueryProps = {}) => {
  return useQuery({
    queryKey: ['bodymeasurements'],
    queryFn: async () => {
      const bodymeasurements = await db.bodymeasurements.toArray()

      return bodymeasurements
        .filter(bodymeasurement => !bodymeasurement.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
