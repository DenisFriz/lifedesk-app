import { api } from './apiClient'

export interface SignatureData {
  timestamp: number
  signature: string
  api_key: string
  cloud_name: string
  folder: string
}

export interface CloudinaryUploadResult {
  secure_url: string
  public_id: string
}

export async function getSignature(folder?: 'uploads' | 'temp'): Promise<SignatureData> {
  const res = await api.post<SignatureData>('/cloudinary/signature', { folder })
  return res.data
}

export async function uploadToCloudinary(
  file: File,
  signedData: SignatureData
): Promise<CloudinaryUploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('timestamp', String(signedData.timestamp))
  formData.append('signature', signedData.signature)
  formData.append('api_key', signedData.api_key)
  formData.append('folder', signedData.folder)

  const url = `https://api.cloudinary.com/v1_1/${signedData.cloud_name}/image/upload`

  const response = await fetch(url, { method: 'POST', body: formData })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `Cloudinary upload failed (${response.status})`)
  }

  const data = await response.json()
  return { secure_url: data.secure_url, public_id: data.public_id }
}

export async function deleteCloudinaryImage(public_id: string): Promise<void> {
  const res = await api.delete('/cloudinary/image', { data: { public_id } })
  if (!res.data) {
    throw new Error('Failed to delete image')
  }
}

export async function moveCloudinaryImages(
  public_ids: string[]
): Promise<Array<{ old_public_id: string; new_public_id: string; new_url: string }>> {
  const res = await api.post<{
    moved: Array<{ old_public_id: string; new_public_id: string; new_url: string }>
  }>('/cloudinary/move', { public_ids })
  return res.data.moved
}
