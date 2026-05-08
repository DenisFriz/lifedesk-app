import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IUserPlan } from '@/types/index.js';

const userPlanSchema = new Schema<IUserPlan>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    plan_name: {
      type: String,
      enum: ['free', 'plus', 'pro', 'enterprise'],
      required: true,
      index: true,
    },
    price_monthly: { type: Number, required: true },
    stripe_price_id: { type: String, maxlength: 255 },
    features: {
      home_goals_limit: Number,
      home_tasks_limit: Number,
      home_calendar_entries_limit: Number,
      home_push_notifications: Boolean,
      home_events_limit: Number,
      ai_assistant: Boolean,
      ai_proactive: Boolean,
      edit_sections: Boolean,
      quick_notes_lines_limit: Number,
      quick_calculator: Boolean,

      time_tracker_entries_limit: Number,

      finance_offline_accounts_limit: Number,
      finance_connect_bank: Boolean,
      finance_manual_csv_transactions: Boolean,
      finance_real_bank_transactions: Boolean,
      finance_auto_categorization: Boolean,
      finance_analytics: Boolean,
      finance_budget_entries_limit: Number,

      assets_overview: Boolean,
      assets_vehicles_limit: Number,
      assets_insurance_expiry_tracking: Boolean,
      assets_inspection_expiry_tracking: Boolean,
      assets_repair_history_entries_limit: Number,
      assets_vehicle_photos_limit: Number,
      assets_estates_limit: Number,
      assets_other_limit: Number,

      health_tracking_entries_limit: Number,
      health_medical_documents_limit: Number,

      fitness_overview: Boolean,
      fitness_workouts_limit: Number,
      fitness_workout_plans_limit: Number,
      fitness_measurements_limit: Number,
      fitness_progress_photos_limit: Number,

      hobbies_limit: Number,
      learning_limit: Number,
      relationships_limit: Number,

      business_manage_businesses_limit: Number,
      business_budget: Boolean,
      business_transactions: Boolean,
      business_projects_limit: Number,
      business_clients_limit: Number,
      business_strategy_limit: Number,
      business_marketing_limit: Number,
      business_content_limit: Number,
      business_ideas_limit: Number,

      community_read: Boolean,
      community_like: Boolean,
      community_comment: Boolean,
      community_submit: Boolean,
    },

    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

userPlanSchema.pre<IUserPlan>('save', function (this: IUserPlan) {
  this.updated_at = new Date().toISOString();
});

export const UserPlan: Model<IUserPlan> = mongoose.model<IUserPlan>(
  'UserPlan',
  userPlanSchema,
);
