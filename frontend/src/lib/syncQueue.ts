import { db } from './localDb'
import { backend } from '@/api/backend'
import type { SyncOperation } from '@/types'
import type { QueryClient } from '@tanstack/react-query'

const entityMap: Record<string, any> = {
  goals: backend.entities.Goal,
  tasks: backend.entities.Task,
  events: backend.entities.Event
}

export const OPTIMISTIC_ID_PREFIX = 'offline_'

export function isOptimisticId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith(OPTIMISTIC_ID_PREFIX)
}

export function generateOptimisticId(): string {
  return `${OPTIMISTIC_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function enqueueMutation(
  entityName: string,
  operation: SyncOperation,
  payload: Record<string, unknown>
): Promise<void> {
  await db.syncQueue.add({
    entityName,
    operation,
    payload,
    timestamp: Date.now(),
    status: 'pending'
  } as any)
}

export async function processSyncQueue(queryClient?: QueryClient): Promise<void> {
  const pending = await db.syncQueue.where('status').equals('pending').sortBy('timestamp')
  if (pending.length === 0) return

  for (const item of pending) {
    const entity = entityMap[item.entityName]
    if (!entity) continue

    try {
      await db.syncQueue.update(item.id!, { status: 'syncing' })

      if (item.operation === 'create') {
        const payloadData = item.payload as Record<string, unknown>
        const { id: _ignored, ...dataWithoutId } = payloadData
        const serverRecord = await entity.create(dataWithoutId)
        const optimisticId = (payloadData as any).optimisticId

        if (serverRecord && optimisticId) {
          const store = (db as any)[item.entityName]
          await store.delete(optimisticId)
          await store.put(serverRecord)

          const laterItems = await db.syncQueue
            .where('status')
            .equals('pending')
            .filter(q => q.payload && (q.payload as Record<string, unknown>).id === optimisticId)
            .toArray()
          for (const later of laterItems) {
            await db.syncQueue.update(later.id!, {
              payload: { ...later.payload, id: serverRecord.id }
            })
          }
        }
      } else if (item.operation === 'update') {
        const payloadData = item.payload as Record<string, unknown>
        await entity.update(payloadData.id, payloadData.data)
      } else if (item.operation === 'delete') {
        const payloadData = item.payload as Record<string, unknown>
        if (!isOptimisticId(payloadData.id)) {
          await entity.delete(payloadData.id)
        }
        const store = (db as any)[item.entityName]
        await store.delete(payloadData.id).catch(() => {})
      }

      await db.syncQueue.delete(item.id!)

      if (queryClient) {
        queryClient.invalidateQueries({ queryKey: [item.entityName] })
      }
    } catch {
      await db.syncQueue.update(item.id!, { status: 'pending' })
    }
  }
}

export async function getPendingCount(): Promise<number> {
  return db.syncQueue.where('status').equals('pending').count()
}

export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear()
}
