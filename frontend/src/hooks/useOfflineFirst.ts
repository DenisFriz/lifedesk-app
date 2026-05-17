import { db } from '@/lib/localDb'
import { enqueueMutation, generateOptimisticId, isOptimisticId } from '@/lib/syncQueue'

export async function offlineFirst<T>(
  storeName: string,
  networkFn: () => Promise<T[]>
): Promise<T[]> {
  const cached = await (db as any)[storeName].toArray()

  if (!navigator.onLine) {
    return cached.length > 0 ? cached : []
  }

  try {
    const fresh = await networkFn()
    await (db as any)[storeName].clear()
    if (fresh && fresh.length > 0) {
      await (db as any)[storeName].bulkAdd(fresh)
    }
    return fresh || []
  } catch {
    return cached
  }
}

export async function offlineCreate<T extends Record<string, unknown>>(
  storeName: string,
  entity: any,
  data: T
): Promise<T & { id: string }> {
  if (navigator.onLine) {
    const serverRecord = await entity.create(data)
    if (serverRecord) {
      try {
        await (db as any)[storeName].put(serverRecord)
      } catch {
        // local cache write failure must not block mutation success
      }
    }
    return serverRecord
  }

  const optimisticId = generateOptimisticId()
  const optimisticRecord: T & {
    id: string
    created_date: string
    updated_date: string
    _optimistic: boolean
  } = {
    ...data,
    id: optimisticId,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    _optimistic: true
  }

  await (db as any)[storeName].put(optimisticRecord)
  await enqueueMutation(storeName, 'create', {
    optimisticId,
    data: optimisticRecord
  })

  return optimisticRecord
}

export async function offlineUpdate<T extends Record<string, unknown>>(
  storeName: string,
  entity: any,
  id: string,
  data: Partial<T>
): Promise<T> {
  if (navigator.onLine && !isOptimisticId(id)) {
    return entity.update(id, data)
  }

  const current = (await (db as any)[storeName].get(id)) ?? {}
  const updated = { ...current, ...data, updated_date: new Date().toISOString() }
  await (db as any)[storeName].put(updated)
  await enqueueMutation(storeName, 'update', { id, data })
  return updated as T
}
