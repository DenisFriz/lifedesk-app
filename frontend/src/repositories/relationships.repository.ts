import { db, RelationShipRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateRelationShipInput = Omit<
  RelationShipRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const relationShipRepository = {
  update: async (id: string, data: Partial<RelationShipRecord>) => {
    let existing = await db.relationships.get(id)

    if (!existing) {
      existing = await db.relationships.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Relationship item not found')
    }

    const updatedRelationShip: RelationShipRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.relationships.put(updatedRelationShip)

    await enqueueMutation('relationships', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedRelationShip
  },
  create: async (data: CreateRelationShipInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const relationShip: RelationShipRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.relationships.put(relationShip)

    await enqueueMutation('relationships', 'create', {
      ...data,
      optimisticId
    })

    return relationShip
  },
  delete: async (id: string) => {
    let existing = await db.relationships.get(id)

    if (!existing) {
      existing = await db.relationships.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Relationship item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.relationships.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('relationships')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('relationships', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
