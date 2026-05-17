import { Types } from 'mongoose';

export interface IPlaidConnection {
  item_id: string;
  access_token: string;
  institution_name: string;
  connected_at: string;
}

export interface IUser {
  _id: Types.ObjectId;
  id: string;
  email: string;
  passwordHash: string | null;
  full_name: string;
  role: 'user' | 'admin';
  subscription_tier: 'free' | 'plus' | 'pro';
  storage_used: number;
  image_count: number;
  auth_provider: 'local' | 'google';
  google_id: string | null;
  google_avatar_url: string | null;
  email_verified: boolean;
  emailVerificationCode: string | null;
  emailVerificationExpires: Date | null;
  plaid_connections: IPlaidConnection[];
  terms_accepted_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

export interface IUserPlan {
  id: string;
  plan_name: 'free' | 'plus' | 'pro' | 'enterprise';
  price_monthly: number;
  stripe_price_id?: string;
  features: {
    home_goals_limit?: number;
    home_tasks_limit?: number;
    home_calendar_entries_limit?: number;
    home_push_notifications?: boolean;
    home_events_limit?: number;

    ai_assistant?: boolean;
    ai_proactive?: boolean;

    edit_sections?: boolean;

    quick_notes_lines_limit?: number;
    quick_calculator?: boolean;

    time_tracker_entries_limit?: number;

    finance_offline_accounts_limit?: number;
    finance_connect_bank?: boolean;
    finance_manual_csv_transactions?: boolean;
    finance_real_bank_transactions?: boolean;
    finance_auto_categorization?: boolean;
    finance_analytics?: boolean;
    finance_budget_entries_limit?: number;

    assets_overview?: boolean;
    assets_vehicles_limit?: number;
    assets_insurance_expiry_tracking?: boolean;
    assets_inspection_expiry_tracking?: boolean;
    assets_repair_history_entries_limit?: number;
    assets_vehicle_photos_limit?: number;
    assets_estates_limit?: number;
    assets_other_limit?: number;

    health_tracking_entries_limit?: number;
    health_medical_documents_limit?: number;

    fitness_overview?: boolean;
    fitness_workouts_limit?: number;
    fitness_workout_plans_limit?: number;
    fitness_measurements_limit?: number;
    fitness_progress_photos_limit?: number;

    hobbies_limit?: number;
    learning_limit?: number;
    relationships_limit?: number;

    business_manage_businesses_limit?: number;
    business_budget?: boolean;
    business_transactions?: boolean;
    business_projects_limit?: number;
    business_clients_limit?: number;
    business_strategy_limit?: number;
    business_marketing_limit?: number;
    business_content_limit?: number;
    business_ideas_limit?: number;

    community_read?: boolean;
    community_like?: boolean;
    community_comment?: boolean;
    community_submit?: boolean;
  };

  created_at: string;
  updated_at: string;
}

export interface ITask {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string | null;
  category: string | null;
  business_id: string | null;
  problem_id: string | null;
  goal_id: string | null;
  important: boolean;
  due_date: string | null;
  due_time: string | null;
  reminders: any[];
  status: string;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  recurrence_interval: number;
  recurrence_days_of_week: string[];
  recurrence_monthly_type: string;
  recurrence_end_type: string;
  recurrence_end_date: string | null;
  recurrence_end_count: number | null;
  excluded_dates: string[];
  parent_recurring_task_id: string | null;
  order: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IGoal {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string | null;
  category: string | null;
  business_id: string | null;
  problem_id: string | null;
  important: boolean;
  target_date: string | null;
  target_time: string | null;
  reminders: any[];
  status: string;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  recurrence_interval: number;
  recurrence_days_of_week: string[];
  recurrence_monthly_type: string;
  recurrence_end_type: string;
  recurrence_end_date: string | null;
  recurrence_end_count: number | null;
  excluded_dates: string[];
  parent_recurring_goal_id: string | null;
  order: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IProblem {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: string | null;
  problem_type: string | null;
  business_id: string | null;
  important: boolean;
  show_in_timeline: boolean;
  date_occurred: string | null;
  date_ended: string | null;
  status: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IEvent {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: string | null;
  business_id: string | null;
  important: boolean;
  start_date: string | null;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  reminders: any[];
  status: string;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  recurrence_interval: number;
  recurrence_days_of_week: string[];
  recurrence_end_type: string;
  recurrence_end_date: string | null;
  recurrence_end_count: number | null;
  excluded_dates: string[];
  parent_recurring_event_id: string | null;
  order: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IBusiness {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  categories: string[];
  color: string;
  order: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IProject {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  description: string | null;
  business_id: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  deadline: string | null;
  client_id: string | null;
  revenue_target: number | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IClient {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  lifetime_value: number | null;
  notes: string | null;
  business_id: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IHobby {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  category: string | null;
  description: string | null;
  skill_level: string;
  status: string;
  started_date: string | null;
  frequency: string | null;
  avg_session_minutes: number | null;
  equipment: string | null;
  color: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface ILearningItem {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  type: string | null;
  status: string;
  progress: number;
  description: string | null;
  url: string | null;
  skill_category: string | null;
  priority: string | null;
  start_date: string | null;
  completed_date: string | null;
  time_invested_hours: number;
  rating: number | null;
  key_takeaways: string | null;
  author: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface ICommunityIdea {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: 'new_feature' | 'optimization' | 'ui_ux' | 'bug_fix' | 'other';
  status:
    | 'new'
    | 'under_review'
    | 'planned'
    | 'in_progress'
    | 'implemented'
    | 'rejected';
  likes_count: number;
  comments_count: number;
  anonymous: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IContact {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  relationship: string | null;
  avatar_color: string | null;
  birthday: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  notes: string | null;
  interests: string[];
  check_in_frequency: string | null;
  last_contact_date: string | null;
  status: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface INote {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  content: string | null;
  category: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IWorkoutPlan {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  type: string | null;
  description: string | null;
  exercises: any[];
  scheduled_days: string[];
  active: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IOfflineAccount {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  balance: number | null;
  currency: string;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IMarketingStrategy {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  business_id: string | null;
  main_goal: string | null;
  smart_specific: string | null;
  smart_measurable: string | null;
  smart_achievable: string | null;
  smart_relevant: string | null;
  smart_time_bound: string | null;
  target_audience: string | null;
  usp: string | null;
  core_message: string | null;
  main_channels: string[];
  notes: string | null;
  status: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IMarketingCampaign {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  name: string;
  business_id: string | null;
  strategy_id: string | null;
  campaign_type: string | null;
  goal: string | null;
  channel: string | null;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  status: string;
  kpis: any[];
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IIdea {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  business_id: string | null;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  potential_impact: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IContentIdea {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  business_id: string | null;
  campaign_id: string | null;
  description: string | null;
  type: string | null;
  platform: string | null;
  status: string;
  publish_date: string | null;
  cta: string | null;
  asset_url: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface ICommunityComment {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  idea_id: string | null;
  content: string | null;
  author_display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface IIncome {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  amount: number | null;
  category: string | null;
  description: string | null;
  date: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IExpense {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  amount: number | null;
  category: string | null;
  description: string | null;
  date: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IRecurringIncome {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  amount: number | null;
  category: string | null;
  description: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IRecurringExpense {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  amount: number | null;
  category: string | null;
  description: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  active: boolean;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IBodyMeasurement {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  weight: number | null;
  body_fat_percentage: number | null;
  waist: number | null;
  notes: string | null;
  date: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IWorkout {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  type: string | null;
  title: string | null;
  duration_minutes: number | null;
  notes: string | null;
  date: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IProgressPhoto {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  url: string | null;
  date: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IMedicalDocument {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string | null;
  type: string | null;
  description: string | null;
  summary: string | null;
  date: string | null;
  url: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface ITangibleAsset {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  category: string | null;
  current_value: number | null;
  purchase_date: string | null;
  purchase_price: number | null;
  description: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface IBankBalanceSnapshot {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  date: string | null;
  account_id: string | null;
  account_name: string | null;
  institution_name: string | null;
  balance: number | null;
  available: number | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ITimeEntry {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  project_id: string | null;
  task_id: string | null;
  duration_minutes: number | null;
  description: string | null;
  date: string | null;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

export interface ISubscription {
  _id?: Types.ObjectId;
  id: string;
  user_id: string;
  user_email: string;
  plan_name: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}
