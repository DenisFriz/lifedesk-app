import { db, ExpenseRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateExpenseInput = Omit<
  ExpenseRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const expenseRepository = {
  update: async (id: string, data: Partial<ExpenseRecord>) => {
    let existing = await db.expenses.get(id)

    if (!existing) {
      existing = await db.expenses.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Expense not found')
    }

    const updated: ExpenseRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.expenses.put(updated)

    await enqueueMutation('expenses', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateExpenseInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const expense: ExpenseRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.expenses.put(expense)

    console.log(expense)
    await enqueueMutation('expenses', 'create', {
      ...data,
      optimisticId
    })

    return expense
  },
  delete: async (id: string) => {
    let existing = await db.expenses.get(id)

    if (!existing) {
      existing = await db.expenses.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Expense not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.expenses.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('expenses')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('expenses', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
