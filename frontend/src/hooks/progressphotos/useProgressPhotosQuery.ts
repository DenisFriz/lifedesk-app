import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

const placeholderPhotos = [
  {
    id: 'placeholder-1',
    image_url: '/progress-photo-1.jpg',
    date: '2026-01-15',
    body_area: 'full_body',
    description: 'Week 1 - Starting point',
    is_archived: false,
    created_by: 'system'
  },
  {
    id: 'placeholder-2',
    image_url: '/progress-photo-2.jpg',
    date: '2026-02-25',
    body_area: 'full_body',
    description: 'Month 2 - Visible transformation',
    is_archived: false,
    created_by: 'system'
  }
] as const

type UseProgressPhotosQueryProps = {
  enabled?: boolean
}

export const useProgressPhotosQuery = ({ enabled }: UseProgressPhotosQueryProps = {}) => {
  return useQuery({
    queryKey: ['progressphotos'],
    queryFn: async () => {
      const progressphotos = await db.progressphotos.toArray()

      const filtered = progressphotos
        .filter(progressphoto => !progressphoto.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

      return filtered.length > 0 ? filtered : placeholderPhotos
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
