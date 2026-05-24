import { db, EventRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export const eventRepository = {
  update: async (id: string, data: Partial<EventRecord>) => {
    let existing = await db.events.get(id)

    if (!existing) {
      existing = await db.events.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Event not found')
    }

    const updatedEvent: EventRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.events.put(updatedEvent)

    await enqueueMutation('events', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedEvent
  },
  create: async (data: EventRecord) => {
    const optimisticId = generateOptimisticId()
    const event = {
      ...data,
      id: optimisticId,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false
    }

    await db.events.put(event)
    await enqueueMutation('events', 'create', { ...data, optimisticId })

    return event
  },
  delete: async (id: string) => {
    let existing = await db.events.get(id)

    if (!existing) {
      existing = await db.events.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Event not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.events.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('events')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('events', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })
  },
  bulkDelete: async (ids: string[]) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.events.get(id)) ?? (await db.events.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validEvents = targets.filter(Boolean) as EventRecord[]

    if (validEvents.length === 0) return []

    const updatedEvents = validEvents.map(event => ({
      ...event,
      is_deleted: true,
      updatedAt: now
    }))

    await db.transaction('rw', db.events, db.syncQueue, async () => {
      await db.events.bulkPut(updatedEvents)

      const idsToRemove = validEvents.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('events')
        .and(item => idsToRemove.includes(item.payload?.id as string))
        .delete()

      for (const event of validEvents) {
        await enqueueMutation('events', 'delete', {
          id: event.serverId ?? event.id,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedEvents
  },
  bulkUpdate: async (ids: string[], data: Partial<EventRecord>) => {
    const now = new Date().toISOString()

    const targets = await Promise.all(
      ids.map(async id => {
        const existing =
          (await db.events.get(id)) ?? (await db.events.where('serverId').equals(id).first())

        return existing ?? null
      })
    )

    const validEvents = targets.filter(Boolean) as EventRecord[]

    if (validEvents.length === 0) return []

    const updatedEvents = validEvents.map(event => ({
      ...event,
      ...data,
      updatedAt: now
    }))

    await db.transaction('rw', db.events, db.syncQueue, async () => {
      await db.events.bulkPut(updatedEvents)

      const idsToClean = validEvents.flatMap(g => [g.id, g.serverId].filter(Boolean))

      await db.syncQueue
        .where('entityName')
        .equals('events')
        .and(item => {
          const payloadId = item.payload?.id
          return typeof payloadId === 'string' && idsToClean.includes(payloadId)
        })
        .delete()

      for (const event of validEvents) {
        await enqueueMutation('events', 'update', {
          id: event.serverId ?? event.id,
          ...data,
          optimisticId: generateOptimisticId()
        })
      }
    })

    return updatedEvents
  },
  duplicate: async (event: EventRecord) => {
    const { id, serverId, createdAt, updatedAt, ...rest } = event as any

    const optimisticId = generateOptimisticId()

    const duplicatedEvent: EventRecord = {
      ...rest,
      id: optimisticId,
      serverId: null,
      title: `${rest.title} (copy)`,
      status: 'active',
      order: (event.order ?? 0) + 0.5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false
    }

    await db.events.put(duplicatedEvent)

    await enqueueMutation('events', 'create', {
      ...duplicatedEvent,
      optimisticId
    })

    return duplicatedEvent
  }
}
