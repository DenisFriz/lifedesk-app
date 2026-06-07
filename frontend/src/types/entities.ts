// Entity interfaces inferred from component usage patterns
// These define the shapes of data entities used throughout the app

export interface Goal {
  id: string
  title: string
  description?: string
  target_date?: string
  status: 'active' | 'completed' | 'archived'
  category?: string
  businessId?: string
  progress?: number
}

export interface Task {
  id: string
  title: string
  description?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high'
  status: 'todo' | 'in_progress' | 'completed' | 'archived'
  category?: string
  tags?: string[]
  businessId?: string
  assignedTo?: string
  created_date: string
}

export interface TimeEntry {
  id: string
  taskId?: string
  description?: string
  start_time: string
  end_time?: string
  duration?: number
  duration_minutes?: number
  category?: string
  businessId?: string
  date?: string
  billable?: boolean
  notes?: string
  client_id?: string
  project_id?: string
  section_id?: string
}

export interface Note {
  id: string
  title?: string
  content: string
  businessId?: string
  updated_date: string
  created_date: string
}

export interface Income {
  id: string
  amount: number
  description?: string
  category: string
  date: string
  businessId?: string
}

export interface Expense {
  id: string
  amount: number
  description?: string
  category: string
  date: string
  businessId?: string
}

export interface BankTransaction {
  id: string
  amount: number
  description: string
  date: string
  merchant_name?: string
  account_id: string
  category?: string
  is_reviewed?: boolean
}

export interface BankAccount {
  id: string
  name: string
  type: string
  balance: number
  mask?: string
  institution_name?: string
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  birthday?: string
  last_checkin?: string
  checkin_frequency?: string
  notes?: string
  tags?: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  start_date: string
  end_date?: string
  all_day?: boolean
  recurrence_rule?: string
  description?: string
  location?: string
  businessId?: string
}

export interface Campaign {
  id: string
  name: string
  strategy_id?: string
  status?: string
  kpis?: string[]
  start_date?: string
  end_date?: string
  budget?: number
  businessId?: string
  campaign_type?: string
  goal?: string
  channel?: string
  notes?: string
}

export interface Strategy {
  id: string
  name: string
  description?: string
  businessId?: string
}

export interface HobbyItem {
  id: string
  name: string
  category?: string
  skill_level?: string
  color?: string
  notes?: string
  last_practiced?: string
}

export interface LearningItem {
  id: string
  title: string
  type?: string
  status?: string
  url?: string
  notes?: string
  priority?: string
  progress_percentage?: number
}

export interface Invoice {
  id: string
  client_name: string
  amount: number
  due_date?: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  businessId?: string
}

export interface Business {
  id: string
  name: string
  type?: string
  description?: string
}

export interface Budget {
  id: string
  category: string
  amount: number
  period: string
  businessId?: string
}

export interface TangibleAsset {
  id: string
  name?: string
  current_value?: number
  purchase_price?: number
}

export interface Workout {
  id: string
  title?: string
  type?: string
  date: string
  duration_minutes?: number
  calories_burned?: number
}

export interface BodyMeasurement {
  id: string
  date: string
  weight: number
  body_fat_percentage?: number
}

export interface Event {
  id: string
  title: string
  start_date: string
  end_date?: string
  start_time?: string
  end_time?: string
  status?: string
  category?: string
  businessId?: string
  recurrence_rule?: string
  all_day?: boolean
}

export interface Problem {
  id: string
  title: string
  description?: string
  status?: string
  priority?: string
  problem_type?: string
  date_occurred?: string
  date_ended?: string
  show_in_timeline?: boolean
  businessId?: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status?: string
  businessId?: string
  is_deleted?: boolean
}

export interface Project {
  id: string
  title: string
  description?: string
  status?: string
  client_id?: string
  start_date?: string
  due_date?: string
  businessId?: string
  is_deleted?: boolean
}

export interface Content {
  id: string
  title: string
  type?: string
  status?: string
  platform?: string
  category?: string
  date?: string
  businessId?: string
}

export interface RecurringIncome {
  id: string
  description?: string
  amount: number
  category?: string
  frequency?: string
  start_date?: string
  businessId?: string
}

export interface RecurringExpense {
  id: string
  description?: string
  amount: number
  category?: string
  frequency?: string
  start_date?: string
  businessId?: string
}

export interface BankSnapshot {
  id: string
  account_id?: string
  date: string
  balance?: number
  connectedBank?: number
  offlineBalance?: number
  total?: number
}

export interface CalculatorHistory {
  id: string
  type: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  created_date: string
}
