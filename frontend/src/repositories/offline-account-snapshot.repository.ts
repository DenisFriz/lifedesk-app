import { db, OfflineAccountSnapshotRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateOfflineAccountSnapshotInput = Omit<
  OfflineAccountSnapshotRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const offlineAccountSnapshotRepository = {
  update: async (id: string, data: Partial<OfflineAccountSnapshotRecord>) => {
    let existing = await db.offlineaccountSnapshots.get(id)

    if (!existing) {
      existing = await db.offlineaccountSnapshots.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('OfflineAccountSnapshot not found')
    }

    const updatedSnapshot: OfflineAccountSnapshotRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.offlineaccountSnapshots.put(updatedSnapshot)

    await enqueueMutation('offlineaccountSnapshots', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedSnapshot
  },
  create: async (data: CreateOfflineAccountSnapshotInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const snapshot: OfflineAccountSnapshotRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.offlineaccountSnapshots.put(snapshot)

    await enqueueMutation('offlineaccountSnapshots', 'create', {
      ...data,
      optimisticId
    })

    return snapshot
  },
  delete: async (id: string) => {
    let existing = await db.offlineaccountSnapshots.get(id)

    if (!existing) {
      existing = await db.offlineaccountSnapshots.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('OfflineAccountSnapshot not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.offlineaccountSnapshots.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('offlineaccountSnapshots')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('offlineaccountSnapshots', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
