import Dexie, { Table } from 'dexie'

export type SyncOperation = 'create' | 'update' | 'delete'

export interface SyncQueueItem {
  localId?: number
  entityName: string
  operation: SyncOperation
  payload: Record<string, unknown>
  timestamp: number
  status: 'pending' | 'syncing'
}

export interface GoalRecord {
  id: string // local primary key (offline-safe)
  serverId?: string | null // backend ID
  title: string
  description: string
  category: string | null
  status: string
  order: number | null
  is_deleted: boolean
  important: boolean
  target_date?: string | null
  target_time?: string | null
  business_id: string | null
  reminders: any[]
  createdAt: string
  updatedAt: string
}

export interface TaskRecord {
  id: string
  serverId?: string | null
  title: string
  description: string | null
  category: string | null
  status: string
  order: number | null
  important: boolean
  is_deleted: boolean
  business_id: string | null
  goal_id?: string | null
  created_by?: string | null
  due_date?: string | null
  due_time?: string | null
  reminders?: any[]
  is_recurring?: boolean
  recurrence_frequency?: string | null
  recurrence_interval?: number
  recurrence_days_of_week?: string[]
  recurrence_monthly_type?: string
  recurrence_end_type?: string
  recurrence_end_date?: string | null
  recurrence_end_count?: number | null
  excluded_dates?: string[]
  parent_recurring_task_id?: string | null
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface EventRecord {
  id: string
  serverId?: string | null
  created_by: string
  title: string
  description: string | null
  category: string | null
  business_id: string | null
  important: boolean
  start_date: string | null
  start_time: string | null
  end_date: string | null
  end_time: string | null
  reminders: any[]
  status: string
  is_recurring: boolean
  recurrence_frequency: string | null
  recurrence_interval: number
  recurrence_days_of_week: string[]
  recurrence_end_type: string
  recurrence_end_date: string | null
  recurrence_end_count: number | null
  excluded_dates: string[]
  parent_recurring_event_id: string | null
  order: number | null
  is_deleted: boolean
  deleted_at: string | null
  deleted_by_process: string | null
  createdAt: string
  updatedAt: string
}

export interface VehicleImageRecord {
  url: string
  thumbnailUrl?: string | null
  uploadedAt: string
}

export interface VehicleRepairRecord {
  date?: string | null // ❗ string (ISO), не Date
  cost?: number | null
  description: string
  images: string[]
}

export interface VehicleRecord {
  id: string // local primary key (offline-safe)
  serverId?: string | null
  title: string
  make?: string | null
  model?: string | null
  year?: number | null
  color?: string | null
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'other' | null
  transmission?: 'automatic' | 'manual' | null
  mileage?: number | null
  license_plate?: string | null
  vin?: string | null
  purchase_price?: number | null
  current_value?: number | null
  purchase_date?: string | null
  insurance_expiry?: string | null
  inspection_expiry?: string | null
  notes: string
  images: VehicleImageRecord[]
  repairs: VehicleRepairRecord[]
  is_deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface EstateRecord {
  id: string
  serverId?: string | null
  title: string
  description: string
  property_type?: 'apartment' | 'house' | 'land' | 'commercial' | 'other' | null
  address?: string | null
  area_sqm?: number | null
  rooms?: number | null
  floor?: number | null
  year_built?: number | null
  purchase_price?: number | null
  current_value?: number | null
  purchase_date?: string | null
  mortgage_amount?: number | null
  monthly_rent?: number | null
  monthly_costs?: number | null
  monthly_mortgage_payment?: number | null
  is_deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface OtherAssetRecord {
  id: string
  serverId?: string | null
  title: string
  description: string
  category?: 'jewelry' | 'art' | 'electronics' | 'other' | null
  purchase_price?: number | null
  current_value?: number | null
  purchase_date?: string | null
  location?: string | null
  is_deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface LearningRecord {
  id: string
  serverId?: string | null
  title: string
  type?:
    | 'course'
    | 'book'
    | 'skill'
    | 'podcast'
    | 'video'
    | 'certification'
    | 'article'
    | 'other'
    | null
  status?: 'want_to_learn' | 'in_progress' | 'completed' | 'on_hold' | null
  progress?: number | null
  description?: string | null
  url?: string | null
  skill_category?: string | null
  priority?: 'high' | 'medium' | 'low' | null
  start_date?: string | null
  completed_date?: string | null
  time_invested_hours?: number | null
  rating?: number | null
  key_takeaways?: string | null
  author?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface RelationShipRecord {
  id: string
  serverId?: string | null
  name: string
  relationship?:
    | 'family'
    | 'close_friend'
    | 'friend'
    | 'colleague'
    | 'acquaintance'
    | 'mentor'
    | 'partner'
    | 'other'
    | null
  avatar_color?:
    | 'rose'
    | 'pink'
    | 'purple'
    | 'indigo'
    | 'blue'
    | 'teal'
    | 'emerald'
    | 'amber'
    | 'orange'
    | null
  birthday?: string | null
  phone?: string | null
  email?: string | null
  location?: string | null
  notes?: string | null
  interests?: string | null
  check_in_frequency?:
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'quarterly'
    | 'twice_a_year'
    | 'yearly'
    | null
  last_contact_date?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface MedicalDocumentRecord {
  id: string
  serverId?: string | null
  title: string
  description?: string | null
  date: string
  type:
    | 'prescription'
    | 'lab_result'
    | 'doctor_note'
    | 'insurance'
    | 'vaccination'
    | 'medical_history'
    | 'health_image'
    | 'other'
  file_url: string
  file_name?: string | null
  file_size?: number | null
  file_type?: string | null
  is_archived: boolean
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkoutRecord {
  id: string
  serverId?: string | null
  created_by: string
  type: string
  title: string
  duration_minutes?: number | null
  calories_burned?: number | null
  date: string
  notes?: string | null
  exercises: {
    name: string
    sets: number | null
    reps: number | null
    weight: number | null
    distance: number | null
    duration: number | null
    notes: string | null
  }[]
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkoutPlanRecord {
  id: string
  serverId?: string | null
  created_by: string
  name: string
  description?: string | null
  type: string
  active: boolean
  scheduled_days: number[]
  exercises: {
    name: string
    sets: number | null
    reps: number | null
    weight: number | null
    distance: number | null
    duration: number | null
    rest_seconds: number | null
    notes: string | null
  }[]
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface BodyMeasurementRecord {
  id: string
  serverId?: string | null
  created_by: string
  date: string
  notes?: string | null
  weight: number | null
  body_fat: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  neck: number | null
  shoulders: number | null
  left_arm: number | null
  right_arm: number | null
  left_thigh: number | null
  right_thigh: number | null
  resting_heart_rate: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProgressPhotoRecord {
  id: string
  serverId?: string | null
  created_by: string
  image_url: string
  date: string
  description?: string | null
  body_area: 'front' | 'back' | 'side' | 'full_body' | 'arms' | 'chest' | 'legs' | 'core' | 'other'
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  is_archived: boolean
  createdAt: string
  updatedAt: string
}

export interface HobbyRecord {
  id: string
  serverId?: string | null
  created_by: string
  name: string
  category:
    | 'music'
    | 'arts_crafts'
    | 'sports_outdoor'
    | 'gaming'
    | 'cooking_food'
    | 'reading_writing'
    | 'technology'
    | 'collecting'
    | 'travel'
    | 'other'
  description?: string | null
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  status: 'active' | 'on_pause' | 'want_to_start' | 'retired'
  started_date?: string | null
  frequency: 'daily' | 'few_times_week' | 'weekly' | 'monthly' | 'occasionally' | null
  avg_session_minutes: number | null
  equipment?: string | null
  color:
    | 'purple'
    | 'pink'
    | 'blue'
    | 'green'
    | 'orange'
    | 'amber'
    | 'rose'
    | 'teal'
    | 'indigo'
    | 'cyan'
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface BusinessRecord {
  id: string
  serverId?: string | null
  created_by: string
  name: string
  description?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

class AppDB extends Dexie {
  goals!: Table<GoalRecord, string>
  tasks!: Table<TaskRecord, string>
  events!: Table<EventRecord, string>
  vehicles!: Table<VehicleRecord, string>
  estates!: Table<EstateRecord, string>
  otherassets!: Table<OtherAssetRecord, string>
  learning!: Table<LearningRecord, string>
  relationships!: Table<RelationShipRecord, string>
  medicaldocuments!: Table<MedicalDocumentRecord, string>
  workouts!: Table<WorkoutRecord, string>
  workoutplans!: Table<WorkoutPlanRecord, string>
  bodymeasurements!: Table<BodyMeasurementRecord, string>
  progressphotos!: Table<ProgressPhotoRecord, string>
  hobbies!: Table<HobbyRecord, string>
  businesses!: Table<BusinessRecord, string>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('AppDB')

    this.version(11).stores({
      goals: 'id, serverId, status, category, is_deleted',
      tasks: 'id, serverId, status, category, is_deleted',
      events: 'id, serverId, status, category, is_deleted',
      vehicles: 'id, serverId, status, category, is_deleted',
      estates: 'id, serverId, status, category, is_deleted',
      otherassets: 'id, serverId, status, category, is_deleted',
      learning: 'id, serverId, status, category, is_deleted',
      relationships: 'id, serverId, status, category, is_deleted',
      medicaldocuments: 'id, serverId, status, category, is_deleted',
      workouts: 'id, serverId, status, category, is_deleted',
      workoutplans: 'id, serverId, status, category, is_deleted',
      bodymeasurements: 'id, serverId, status, category, is_deleted',
      progressphotos: 'id, serverId, status, category, is_deleted',
      hobbies: 'id, serverId, status, category, is_deleted',
      businesses: 'id, serverId, status, category, is_deleted',
      syncQueue: '++localId, entityName, operation, timestamp, status'
    })
  }
}

export const db = new AppDB()
