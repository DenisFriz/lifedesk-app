import { db } from '@/db'
import { useQuery } from '@tanstack/react-query'

type UseMedicalDocumentQueryProps = {
  enabled?: boolean
}

export const useMedicalDocumentsQuery = ({ enabled }: UseMedicalDocumentQueryProps = {}) => {
  return useQuery({
    queryKey: ['medicaldocuments'],
    queryFn: async () => {
      const medicaldocuments = await db.medicaldocuments.toArray()

      return medicaldocuments
        .filter(medicaldocument => !medicaldocument.is_deleted)
        .sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
    },

    staleTime: Infinity,
    networkMode: 'always',
    enabled
  })
}
