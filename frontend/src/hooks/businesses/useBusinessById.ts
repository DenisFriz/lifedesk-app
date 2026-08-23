import { useBusinessesQuery } from '@/hooks/businesses/useBusinessesQuery'

export function useBusinessById(businessId: string | null) {
  const { data: businesses = [], ...query } = useBusinessesQuery()

  const business =
    businessId == null
      ? null
      : (businesses.find(b => {
          const ids = [b.id, b.serverId, (b as any)._id].filter(Boolean)
          return ids.some(id => String(id) === String(businessId))
        }) ?? null)

  return { business, businesses, ...query }
}
