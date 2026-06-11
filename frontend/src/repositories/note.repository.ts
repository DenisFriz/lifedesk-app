import { db, NoteRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreatNoteInput = Omit<
  NoteRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const noteRepository = {
  update: async (id: string, data: Partial<NoteRecord>) => {
    let existing = await db.notes.get(id)

    if (!existing) {
      existing = await db.notes.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Note not found')
    }

    const updated: NoteRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.notes.put(updated)

    await enqueueMutation('notes', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updated
  },
  create: async (data: CreatNoteInput) => {
    const optimisticId = generateOptimisticId()
    const note = {
      ...data,
      id: optimisticId,
      description: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      is_deleted: false
    }

    await db.notes.put(note)
    await enqueueMutation('notes', 'create', { ...data, optimisticId })

    return note
  },
  delete: async (id: string) => {
    let existing = await db.notes.get(id)

    if (!existing) {
      existing = await db.notes.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Note not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.notes.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('notes')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('notes', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })
  }
}
