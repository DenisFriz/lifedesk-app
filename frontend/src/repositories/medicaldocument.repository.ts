import { db, MedicalDocumentRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateMedicalDocumentInput = Omit<
  MedicalDocumentRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const medicalDocumentRepository = {
  update: async (id: string, data: Partial<MedicalDocumentRecord>) => {
    let existing = await db.medicaldocuments.get(id)

    if (!existing) {
      existing = await db.medicaldocuments.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Medical document item not found')
    }

    const updatedMedicalDocument: MedicalDocumentRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.medicaldocuments.put(updatedMedicalDocument)

    await enqueueMutation('medicaldocuments', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedMedicalDocument
  },
  create: async (data: CreateMedicalDocumentInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const medicaldocument: MedicalDocumentRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.medicaldocuments.put(medicaldocument)

    await enqueueMutation('medicaldocuments', 'create', {
      ...data,
      optimisticId
    })

    return medicaldocument
  },
  delete: async (id: string) => {
    let existing = await db.medicaldocuments.get(id)

    if (!existing) {
      existing = await db.medicaldocuments.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Medical document item not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.medicaldocuments.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('medicaldocuments')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('medicaldocuments', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
