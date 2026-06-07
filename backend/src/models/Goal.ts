import mongoose, { Schema, Model, Types } from 'mongoose';

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

const goalSchema = new Schema<IGoal>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: null },
    category: { type: String, default: null },
    business_id: { type: String, default: null },
    problem_id: { type: String, default: null },
    important: { type: Boolean, default: false },
    target_date: { type: String, default: null },
    target_time: { type: String, default: null },
    reminders: [Schema.Types.Mixed],
    status: { type: String, default: 'pending' },
    is_recurring: { type: Boolean, default: false },
    recurrence_frequency: { type: String, default: null },
    recurrence_interval: { type: Number, default: 1 },
    recurrence_days_of_week: [String],
    recurrence_monthly_type: { type: String, default: 'date' },
    recurrence_end_type: { type: String, default: 'never' },
    recurrence_end_date: { type: String, default: null },
    recurrence_end_count: { type: Number, default: null },
    excluded_dates: [String],
    parent_recurring_goal_id: { type: String, default: null },
    order: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const Goal: Model<IGoal> = mongoose.model<IGoal>('Goal', goalSchema);
