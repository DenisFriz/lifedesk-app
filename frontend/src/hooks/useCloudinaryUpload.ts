import { useState } from 'react'
import {
  getSignature,
  uploadToCloudinary,
  type CloudinaryUploadResult
} from '@/api/cloudinaryService'

interface UseCloudinaryUploadReturn {
  upload: (file: File, folder?: string) => Promise<CloudinaryUploadResult>
  isLoading: boolean
  error: string | null
}

export function useCloudinaryUpload(): UseCloudinaryUploadReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File, folder?: 'uploads' | 'temp'): Promise<CloudinaryUploadResult> {
    setIsLoading(true)
    setError(null)

    try {
      const signedData = await getSignature(folder)
      const result = await uploadToCloudinary(file, signedData)
      return result
    } catch (err: any) {
      const message = err?.message ?? 'Upload failed'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { upload, isLoading, error }
}
