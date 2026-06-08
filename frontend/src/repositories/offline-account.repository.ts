import { db, OfflineAccountRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateOfflineAccountInput = Omit<
  OfflineAccountRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const offlineAccountRepository = {
  update: async (id: string, data: Partial<OfflineAccountRecord>) => {
    let existing = await db.offlineaccounts.get(id)

    if (!existing) {
      existing = await db.offlineaccounts.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Offline account not found')
    }

    const updated: OfflineAccountRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.offlineaccounts.put(updated)

    await enqueueMutation('offlineaccounts', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateOfflineAccountInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const offlineAccount: OfflineAccountRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.offlineaccounts.put(offlineAccount)

    await enqueueMutation('offlineaccounts', 'create', {
      ...data,
      optimisticId
    })

    return offlineAccount
  },
  delete: async (id: string) => {
    let existing = await db.offlineaccounts.get(id)

    if (!existing) {
      existing = await db.offlineaccounts.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Offline account not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.offlineaccounts.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('offlineaccounts')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('offlineaccounts', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
