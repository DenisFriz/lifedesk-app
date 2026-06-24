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
  priority: any
  problem_id: any
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
  public_id: string
  uploadedAt: string
}

export interface VehicleRepairRecord {
  date?: string | null // ❗ string (ISO), не Date
  cost?: number | null
  description: string
  images: VehicleImageRecord[]
}

export interface VehicleRecord {
  id: string // local primary key (offline-safe)
  serverId?: string | null
  title: string
  images: VehicleImageRecord[]
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
  file_url?: string
  public_id?: string
  file_name?: string | null
  file_size?: number | null
  file_type?: string | null
  is_archived?: boolean
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
  public_id?: string | null
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
  categories?: any
  createdAt: string
  updatedAt: string
}

export interface IncomeRecord {
  id: string
  serverId?: string | null
  title: string
  amount: number
  date?: string | null
  category?: string | null
  business_id?: string | null
  bank_account_name?: string | null
  notes: string
  is_recurring: boolean
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | null
  start_date?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface ExpenseRecord {
  id: string
  serverId?: string | null
  title: string
  amount: number
  date?: string | null
  category?: string | null
  business_id?: string | null
  bank_account_name?: string | null
  notes: string
  is_recurring: boolean
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | null
  start_date?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProblemRecord {
  id: string
  serverId?: string | null
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  business_id?: string | null
  problem_type?: string | null
  goal_id?: string | null
  resolved: boolean
  resolved_at?: string | null
  category?: string | null
  status: 'active' | 'resolved' | 'archived'
  important: boolean
  show_in_timeline: boolean
  is_deleted: boolean
  deleted_at?: string | null
  date_occurred?: string | null
  date_ended?: string | null
  createdAt: string
  updatedAt: string
}

export interface TimeEntryRecord {
  id: string
  serverId?: string | null
  date: string
  start_time: string
  end_time?: string | null
  duration?: number | null
  description: string
  notes?: string | null
  section_id?: string | null
  client_id?: string | null
  project_id?: string | null
  is_running: boolean
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface ProjectRecord {
  id: string
  serverId?: string | null
  name: string
  description?: string | null
  business_id?: string | null
  client_id?: string | null
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled'
  start_date?: string | null
  deadline?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface ClientRecord {
  id: string
  serverId?: string | null
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  status: 'lead' | 'active' | 'inactive' | 'past'
  notes?: string | null
  business_id?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface MarketingStrategyRecord {
  id: string
  serverId?: string | null
  name: string
  main_goal?: string | null
  smart_specific?: string | null
  smart_measurable?: string | null
  smart_achievable?: string | null
  smart_relevant?: string | null
  smart_time_bound?: string | null
  target_audience?: string | null
  usp?: string | null
  core_message?: string | null
  main_channels: string[]
  notes?: string | null
  status: 'draft' | 'active' | 'paused' | 'completed'
  business_id?: string | null
  goal_id?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface MarketingCampaignRecord {
  id: string
  serverId?: string | null
  name: string
  strategy_id?: string | null
  campaign_type: string
  goal?: string | null
  channel?: string | null
  start_date?: string | null
  end_date?: string | null
  budget?: number | null
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'
  kpis: {
    name: string
    target: string
    actual: string
  }[]
  notes?: string | null
  business_id?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface MarketingContentRecord {
  id: string
  serverId?: string | null
  title: string
  campaign_id?: string | null
  type: string
  platform: string
  status: string
  publish_date?: string | null
  cta?: string | null
  asset_url?: string | null
  description?: string | null
  notes?: string | null
  business_id?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface OfflineAccountRecord {
  id: string
  serverId?: string | null
  created_by: string
  name: string
  balance: number
  currency: string
  notes?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface OfflineAccountSnapshotRecord {
  id: string
  serverId?: string | null
  account_id: string
  currency: string
  date: string
  balance: number
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface RecurringIncomeRecord {
  id: string
  serverId?: string | null
  created_by: string
  title: string
  amount: number
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  category?: string | null
  active: boolean
  business_id?: string | null
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface RecurringExpenseRecord {
  id: string
  serverId?: string | null
  created_by: string
  title: string
  amount: number
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
  start_date: string
  category: string | null
  active: boolean
  business_id: string | null
  is_deleted: boolean
  deleted_at?: string | null
  createdAt: string
  updatedAt: string
}

export interface CommunityIdeaRecord {
  id: string
  serverId?: string | null
  created_by: string
  title: string
  description: string
  category: 'new_feature' | 'optimization' | 'ui_ux' | 'bug_fix' | 'other'
  likes_count: number
  comments_count: number
  anonymous: boolean
  status: 'new' | 'under_review' | 'planned' | 'in_progress' | 'implemented'
  is_deleted: boolean
  deleted_at?: string | null
  deleted_by_process?: string | null
  createdAt: string
  updatedAt: string
}

export interface NoteRecord {
  id: string
  serverId?: string | null
  created_by: string
  category: string
  content: string
  business_id: string | null
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
  incomes!: Table<IncomeRecord, string>
  expenses!: Table<ExpenseRecord, string>
  problems!: Table<ProblemRecord, string>
  timeentries!: Table<TimeEntryRecord, string>
  projects!: Table<ProjectRecord, string>
  clients!: Table<ClientRecord, string>
  marketingstrategies!: Table<MarketingStrategyRecord, string>
  marketingcampaigns!: Table<MarketingCampaignRecord, string>
  marketingcontents!: Table<MarketingContentRecord, string>
  offlineaccounts!: Table<OfflineAccountRecord, string>
  offlineaccountSnapshots!: Table<OfflineAccountSnapshotRecord, string>
  recurringincomes!: Table<RecurringIncomeRecord, string>
  recurringexpenses!: Table<RecurringExpenseRecord, string>
  communityideas!: Table<CommunityIdeaRecord, string>
  notes!: Table<NoteRecord, string>
  syncQueue!: Table<SyncQueueItem, number>

  constructor() {
    super('AppDB')

    this.version(28).stores({
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
      incomes: 'id, serverId, status, category, is_deleted',
      expenses: 'id, serverId, status, category, is_deleted',
      problems: 'id, serverId, status, category, is_deleted',
      timeentries: 'id, serverId, date, is_deleted',
      projects: 'id, serverId, name, status, business_id, is_deleted',
      clients: 'id, serverId, name, status, business_id, is_deleted',
      marketingstrategies: 'id, serverId, name, status, is_deleted',
      marketingcampaigns: 'id, serverId, name, status, is_deleted',
      marketingcontents: 'id, serverId, title, status, category, is_deleted',
      offlineaccounts:
        'id, serverId, created_by, name, balance, currency, notes, is_deleted, deleted_at, createdAt, updatedAt',
      offlineaccountSnapshots:
        'id, serverId, account_id, currency, date, balance, is_deleted, deleted_at, createdAt, updatedAt',
      recurringincomes: 'id, serverId, is_deleted, deleted_at, createdAt, updatedAt',
      recurringexpenses: 'id, serverId, is_deleted, deleted_at, createdAt, updatedAt',
      communityideas:
        'id, serverId, created_by, category, likes_count, comments_count, is_deleted, createdAt, updatedAt',
      notes: 'id, serverId, category, is_deleted',
      syncQueue: '++localId, entityName, operation, timestamp, status'
    })
  }
}

export const db = new AppDB()
