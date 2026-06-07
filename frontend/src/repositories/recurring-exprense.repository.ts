import { db, RecurringExpenseRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateRecurringExpenseInput = Omit<
  RecurringExpenseRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const recurringExpenseRepository = {
  update: async (id: string, data: Partial<RecurringExpenseRecord>) => {
    let existing = await db.recurringexpenses.get(id)

    if (!existing) {
      existing = await db.recurringexpenses.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Estate not found')
    }

    const updated: RecurringExpenseRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.recurringexpenses.put(updated)

    await enqueueMutation('recurringexpenses', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateRecurringExpenseInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const recurringExpense: RecurringExpenseRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.recurringexpenses.put(recurringExpense)

    await enqueueMutation('recurringexpenses', 'create', {
      ...data,
      optimisticId
    })

    return recurringExpense
  },
  delete: async (id: string) => {
    let existing = await db.recurringexpenses.get(id)

    if (!existing) {
      existing = await db.recurringexpenses.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Vehicle not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.recurringexpenses.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('recurringexpenses')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('recurringexpenses', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
