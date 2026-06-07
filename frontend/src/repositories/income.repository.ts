import { db, IncomeRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateIncomeInput = Omit<
  IncomeRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const incomeRepository = {
  update: async (id: string, data: Partial<IncomeRecord>) => {
    let existing = await db.incomes.get(id)

    if (!existing) {
      existing = await db.incomes.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Income not found')
    }

    const updated: IncomeRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.incomes.put(updated)

    await enqueueMutation('incomes', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateIncomeInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const income: IncomeRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.incomes.put(income)

    await enqueueMutation('incomes', 'create', {
      ...data,
      optimisticId
    })

    return income
  },
  delete: async (id: string) => {
    let existing = await db.incomes.get(id)

    if (!existing) {
      existing = await db.incomes.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Income not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.incomes.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('incomes')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('incomes', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
