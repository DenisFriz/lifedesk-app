import { db, ProblemRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateProblemInput = Omit<
  ProblemRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const problemRepository = {
  update: async (id: string, data: Partial<ProblemRecord>) => {
    let existing = await db.problems.get(id)

    if (!existing) {
      existing = await db.problems.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Problem not found')
    }

    const updated: ProblemRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.problems.put(updated)

    await enqueueMutation('problems', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateProblemInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const problem: ProblemRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.problems.put(problem)

    await enqueueMutation('problems', 'create', {
      ...data,
      optimisticId
    })

    return problem
  },
  delete: async (id: string) => {
    let existing = await db.problems.get(id)

    if (!existing) {
      existing = await db.problems.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Problem not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.problems.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('problems')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('problems', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
