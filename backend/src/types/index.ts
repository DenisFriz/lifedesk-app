import { Types } from 'mongoose';

export interface IPlaidConnection {
  item_id: string;
  access_token: string;
  institution_name: string;
  connected_at: string;
}

export interface IUser {
  _id: Types.ObjectId;
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
  profile_image_url: string | null;
  profile_image_public_id: string | null;
  email_verified: boolean;
  emailVerificationCode: string | null;
  emailVerificationExpires: Date | null;
  plaid_connections: IPlaidConnection[];
  terms_accepted_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserPlan {
  id: string;
  plan_name: 'free' | 'plus' | 'pro';
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

export interface IEvent {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
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
