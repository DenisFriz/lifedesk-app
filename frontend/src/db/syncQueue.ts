import { db } from '.'
import { backend } from '@/api/backend'
import type { QueryClient } from '@tanstack/react-query'
import { syncEntity } from './syncEntity'

const entityMap: Record<string, any> = {
  goals: backend.entities.Goal,
  tasks: backend.entities.Task,
  events: backend.entities.Event,
  vehicles: backend.entities.Vehicle,
  estates: backend.entities.Estate,
  otherassets: backend.entities.OtherAsset,
  learning: backend.entities.Learning,
  relationships: backend.entities.RelationShip,
  medicaldocuments: backend.entities.MedicalDocument,
  workouts: backend.entities.Workout,
  workoutplans: backend.entities.WorkoutPlan,
  progressphotos: backend.entities.ProgressPhoto
}

let isSyncing = false

export const OPTIMISTIC_ID_PREFIX = 'offline_'

export function isOptimisticId(id: unknown): id is string {
  return typeof id === 'string' && id.startsWith(OPTIMISTIC_ID_PREFIX)
}

export function generateOptimisticId(): string {
  return `${OPTIMISTIC_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function enqueueMutation(
  entityName: string,
  operation: 'create' | 'update' | 'delete',
  payload: Record<string, unknown>
): Promise<void> {
  await db.syncQueue.add({
    entityName,
    operation,
    payload,
    timestamp: Date.now(),
    status: 'pending'
  } as any)
  window.dispatchEvent(new CustomEvent('syncqueue:updated'))
}

function isDependentOnCreate(item, resolvedIds) {
  const id = item.payload.id
  return isOptimisticId(id) && !resolvedIds.has(id)
}

export async function processSyncQueue(queryClient?: QueryClient): Promise<void> {
  if (isSyncing) return
  isSyncing = true

  const resolvedIds = new Map()

  try {
    const attemptedIds = new Set<number>()
    const affectedEntities = new Set<string>()

    while (true) {
      const pending = await db.syncQueue.where('status').equals('pending').sortBy('timestamp')

      const newItems = pending.filter(item => !attemptedIds.has(item.localId!))
      if (newItems.length === 0) break

      for (const item of newItems) {
        attemptedIds.add(item.localId!)
        affectedEntities.add(item.entityName)

        const entity = entityMap[item.entityName]
        if (!entity) continue

        try {
          await db.syncQueue.update(item.localId, {
            status: 'syncing'
          })

          // =========================
          // CREATE
          // =========================
          if (item.operation === 'create') {
            const { optimisticId, id: _localId, ...data } = item.payload as Record<string, unknown>

            const serverRecord = await entity.create(data)

            if (!serverRecord?._id) {
              throw new Error('Server did not return _id')
            }

            resolvedIds.set(optimisticId, serverRecord._id)

            const store = (db as any)[item.entityName]
            const existing = await store.get(optimisticId)

            await store.delete(optimisticId)
            const { _id: _serverId, ...serverFields } = serverRecord
            await store.put({
              ...existing,
              ...serverFields,
              id: _serverId,
              _optimistic: undefined
            })

            const laterItems = await db.syncQueue
              .where('status')
              .equals('pending')
              .filter(q => (q.payload as any).id === optimisticId)
              .toArray()

            for (const later of laterItems) {
              await db.syncQueue.update(later.localId!, {
                payload: {
                  ...later.payload,
                  id: serverRecord._id
                }
              })
            }
          }

          // =========================
          // UPDATE
          // =========================
          else if (item.operation === 'update') {
            const { id, serverId, ...data } = item.payload as any

            const rawId = id || serverId
            const realId = resolvedIds.get(rawId) ?? rawId

            await entity.update(realId, data)
            queryClient.invalidateQueries({ queryKey: [item.entityName] })
          }

          // =========================
          // DELETE
          // =========================
          else if (item.operation === 'delete') {
            const { id } = item.payload as any

            const realId = resolvedIds.get(id) ?? id

            if (!isOptimisticId(realId)) {
              await entity.delete(realId)
            }

            const store = (db as any)[item.entityName]
            await store.delete(id).catch(() => {})
          }

          await db.syncQueue.delete(item.localId!)
          queryClient?.invalidateQueries({ queryKey: [item.entityName] })
        } catch {
          await db.syncQueue.update(item.localId!, { status: 'pending' })
        }
      }
    }

    for (const entityName of affectedEntities) {
      const entity = entityMap[entityName]
      const store = (db as any)[entityName]

      if (!entity || !store) continue

      const serverData = await entity.list()

      await syncEntity(entityName, serverData)

      queryClient.invalidateQueries({
        queryKey: [entityName],
        refetchType: 'all'
      })
    }
  } finally {
    isSyncing = false
  }
}

export async function getPendingCount(): Promise<number> {
  return db.syncQueue.where('status').equals('pending').count()
}

export async function clearSyncQueue(): Promise<void> {
  await db.syncQueue.clear()
}
