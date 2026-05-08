import { AlertCircle, HardDrive } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  storagePercent?: number
  imagePercent?: number
  currentStorage: number
  currentImages: number
  maxStorage?: number
  maxImages?: number
}

export default function StorageWarning({
  storagePercent,
  imagePercent,
  currentStorage,
  currentImages,
  maxStorage = 1,
  maxImages = 500
}: Props) {
  if (!storagePercent && !imagePercent) return null

  const storageGB = (currentStorage / (1024 * 1024 * 1024)).toFixed(2)
  const maxGB = maxStorage.toFixed(2)
  const isStorageWarning = storagePercent >= 80
  const isImageWarning = imagePercent >= 80

  return (
    <div className="space-y-2">
      {storagePercent !== undefined && (
        <div
          className={cn(
            'p-3 rounded-lg border',
            storagePercent >= 90
              ? 'bg-red-50 border-red-200'
              : isStorageWarning
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <HardDrive
              className={cn(
                'w-4 h-4',
                storagePercent >= 90
                  ? 'text-red-600'
                  : isStorageWarning
                    ? 'text-amber-600'
                    : 'text-blue-600'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                storagePercent >= 90
                  ? 'text-red-900'
                  : isStorageWarning
                    ? 'text-amber-900'
                    : 'text-blue-900'
              )}
            >
              Storage: {storageGB}GB / {maxGB}GB
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                storagePercent >= 90
                  ? 'bg-red-600'
                  : isStorageWarning
                    ? 'bg-amber-600'
                    : 'bg-blue-600'
              )}
              style={{ width: `${Math.min(storagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {imagePercent !== undefined && (
        <div
          className={cn(
            'p-3 rounded-lg border',
            imagePercent >= 90
              ? 'bg-red-50 border-red-200'
              : isImageWarning
                ? 'bg-amber-50 border-amber-200'
                : 'bg-blue-50 border-blue-200'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle
              className={cn(
                'w-4 h-4',
                imagePercent >= 90
                  ? 'text-red-600'
                  : isImageWarning
                    ? 'text-amber-600'
                    : 'text-blue-600'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                imagePercent >= 90
                  ? 'text-red-900'
                  : isImageWarning
                    ? 'text-amber-900'
                    : 'text-blue-900'
              )}
            >
              Images: {currentImages} / {maxImages}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                imagePercent >= 90 ? 'bg-red-600' : isImageWarning ? 'bg-amber-600' : 'bg-blue-600'
              )}
              style={{ width: `${Math.min(imagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
