import { db, TimeEntryRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateTimeEntryInput = Omit<
  TimeEntryRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const timeEntryRepository = {
  update: async (id: string, data: Partial<TimeEntryRecord>) => {
    let existing = await db.timeentries.get(id)

    if (!existing) {
      existing = await db.timeentries.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('TimeEntry not found')
    }

    const updated: TimeEntryRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.timeentries.put(updated)

    await enqueueMutation('timeentries', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateTimeEntryInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const timeEntry: TimeEntryRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.timeentries.put(timeEntry)

    await enqueueMutation('timeentries', 'create', {
      ...data,
      optimisticId
    })

    return timeEntry
  },
  delete: async (id: string) => {
    let existing = await db.timeentries.get(id)

    if (!existing) {
      existing = await db.timeentries.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('TimeEntry not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.timeentries.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('timeentries')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('timeentries', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
