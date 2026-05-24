/**
 * OfflineSyncManager
 *
 * Invisible component that:
 * 1. Shows a small banner when offline.
 * 2. Processes the sync queue automatically when the connection is restored.
 */
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { processSyncQueue, getPendingCount, clearSyncQueue } from '@/db/syncQueue'
import { WifiOff, RefreshCw } from 'lucide-react'

export default function OfflineSyncManager() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [syncing, setSyncing] = useState<boolean>(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      // Process queued mutations now that we're back online
      setSyncing(true)
      await processSyncQueue(queryClient)
      const remaining = await getPendingCount()
      setPendingCount(remaining)
      setSyncing(false)
    }

    const handleOffline = async () => {
      setIsOnline(false)
      const count = await getPendingCount()
      setPendingCount(count)
    }

    const handleQueueUpdated = async () => {
      if (!navigator.onLine) return
      setSyncing(true)
      await processSyncQueue(queryClient)
      setPendingCount(await getPendingCount())
      setSyncing(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('syncqueue:updated', handleQueueUpdated)

    // On mount: sync any leftover pending items
    getPendingCount().then(async count => {
      if (count > 0 && navigator.onLine) {
        setSyncing(true)
        await processSyncQueue(queryClient)
        setPendingCount(await getPendingCount())
        setSyncing(false)
      } else {
        setPendingCount(count)
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('syncqueue:updated', handleQueueUpdated)
    }
  }, [queryClient])

  if (isOnline && pendingCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 items-end">
      {!isOnline && (
        <div className="flex items-center gap-2 bg-slate-800 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>You're offline — viewing cached data</span>
        </div>
      )}
      {isOnline && syncing && (
        <div className="flex items-center gap-2 bg-indigo-600 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Syncing changes…</span>
        </div>
      )}
      {isOnline && !syncing && pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-amber-600 text-white text-sm px-4 py-2 rounded-full shadow-lg">
          <RefreshCw className="w-4 h-4" />
          <span>
            {pendingCount} change{pendingCount !== 1 ? 's' : ''} pending sync
          </span>
        </div>
      )}
    </div>
  )
}
