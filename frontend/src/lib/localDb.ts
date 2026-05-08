import Dexie, { type Table } from 'dexie'
import type { SyncQueueItem } from '@/types'

interface Goal {
  id?: string
  [key: string]: unknown
}

interface Task {
  id?: string
  [key: string]: unknown
}

interface CalendarEvent {
  id?: string
  [key: string]: unknown
}

class AppDatabase extends Dexie {
  goals!: Table<Goal, string>
  tasks!: Table<Task, string>
  events!: Table<CalendarEvent, string>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('LifeDeskOfflineDB')
    this.version(201).stores({
      goals: 'id, status, category, updated_date',
      tasks: 'id, status, category, updated_date',
      events: 'id, status, category, updated_date',
      syncQueue: '++localId, entityName, operation, timestamp, status'
    })
  }
}

export const db = new AppDatabase()
