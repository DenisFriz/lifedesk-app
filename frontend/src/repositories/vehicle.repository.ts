import { db, VehicleRecord } from '@/db'
import { generateOptimisticId, enqueueMutation } from '@/db/syncQueue'

export type CreateVehicleInput = Omit<
  VehicleRecord,
  'id' | 'serverId' | 'createdAt' | 'updatedAt' | 'is_deleted'
>

export const vehicleRepository = {
  update: async (id: string, data: Partial<VehicleRecord>) => {
    let existing = await db.vehicles.get(id)

    if (!existing) {
      existing = await db.vehicles.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Vehicle not found')
    }

    const updatedVehicle: VehicleRecord = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString()
    }

    await db.vehicles.put(updatedVehicle)

    await enqueueMutation('vehicles', 'update', {
      id: existing.serverId ?? existing.id,
      ...data
    })

    return updatedVehicle
  },
  create: async (data: CreateVehicleInput) => {
    const optimisticId = generateOptimisticId()

    const now = new Date().toISOString()

    const vehicle: VehicleRecord = {
      ...data,

      id: optimisticId,
      serverId: null,
      is_deleted: false,
      createdAt: now,
      updatedAt: now
    }

    await db.vehicles.put(vehicle)

    await enqueueMutation('vehicles', 'create', {
      ...data,
      optimisticId
    })

    return vehicle
  },
  delete: async (id: string) => {
    let existing = await db.vehicles.get(id)

    if (!existing) {
      existing = await db.vehicles.where('serverId').equals(id).first()
    }

    if (!existing) {
      throw new Error('Vehicle not found')
    }

    const updated = {
      ...existing,
      is_deleted: true,
      updatedAt: new Date().toISOString()
    }

    await db.vehicles.put(updated)

    await db.syncQueue
      .where('entityName')
      .equals('vehicles')
      .and(item => item.payload?.id === existing.id || item.payload?.id === existing.serverId)
      .delete()

    await enqueueMutation('vehicles', 'delete', {
      id: existing.serverId ?? existing.id,
      optimisticId: generateOptimisticId()
    })

    return updated
  }
}
