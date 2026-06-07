import { db, RecurringIncomeRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateRecurringIncomeInput = Omit<
  RecurringIncomeRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const recurringIncomeRepository = {
  update: async (id: string, data: Partial<RecurringIncomeRecord>) => {
    let existing = await db.recurringincomes.get(id)

    if (!existing) {
      existing = await db.recurringincomes.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Recurring income not found')
    }

    const update: RecurringIncomeRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.recurringincomes.put(update)

    await enqueueMutation('recurringincomes', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return update
  },
  create: async (data: CreateRecurringIncomeInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const recurringIncome: RecurringIncomeRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.recurringincomes.put(recurringIncome)

    await enqueueMutation('recurringincomes', 'create', {
      ...data,
      optimisticId
    })

    return recurringIncome
  },
  delete: async (id: string) => {
    let existing = await db.recurringincomes.get(id)

    if (!existing) {
      existing = await db.recurringincomes.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Recurring income not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.recurringincomes.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('recurringincomes')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('recurringincomes', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
