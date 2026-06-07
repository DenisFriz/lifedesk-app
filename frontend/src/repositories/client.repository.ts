import { ClientRecord, db } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateClientInput = Omit<
  ClientRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const clientRepository = {
  update: async (id: string, data: Partial<ClientRecord>) => {
    let existing = await db.clients.get(id)

    if (!existing) {
      existing = await db.clients.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Client not found')
    }

    const updated: ClientRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.clients.put(updated)

    await enqueueMutation('clients', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreateClientInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const client: ClientRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.clients.put(client)

    await enqueueMutation('clients', 'create', {
      ...data,
      optimisticId
    })

    return client
  },
  delete: async (id: string) => {
    let existing = await db.clients.get(id)

    if (!existing) {
      existing = await db.clients.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Client not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.clients.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('clients')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('clients', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  },
  bulkDelete: async (ids: string[]) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.clients.get(id)) ?? (await db.clients.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validClients = targets.filter(Boolean) as ClientRecord[]

    if (validClients.length === 0) return []

    const updatedClients = validClients.map(client => ({
      ...client,
      is_deleted: true,
      updatedAt: now
    }))

    await db.transaction('rw', db.clients, db.syncQueue, async () => {
      await db.clients.bulkPut(updatedClients)

      const idsToRemove = validClients.flatMap(c => [c.id, c.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('clients')
        .and(item => idsToRemove.includes(item.payload?.id as string))
        .delete()

      for (const client of validClients) {
        await enqueueMutation('clients', 'delete', {
          id: client.serverId ?? client.id,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedClients
  },
  bulkUpdate: async (ids: string[], data: Partial<ClientRecord>) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.clients.get(id)) ?? (await db.clients.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validClients = targets.filter(Boolean) as ClientRecord[]

    if (validClients.length === 0) return []

    const updatedClients = validClients.map(client => ({
      ...client,
      ...data,
      updatedAt: now
    }))

    await db.transaction('rw', db.clients, db.syncQueue, async () => {
      await db.clients.bulkPut(updatedClients)

      const idsToClean = validClients.flatMap(c => [c.id, c.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('clients')
        .and(item => {
          const payloadId = item.payload?.id
          return typeof payloadId === 'string' && idsToClean.includes(payloadId)
        })
        .delete()

      for (const client of validClients) {
        await enqueueMutation('clients', 'update', {
          id: client.serverId ?? client.id,
          ...data,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedClients
  }
}
