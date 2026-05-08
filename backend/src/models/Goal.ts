import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IGoal } from '@/types/index.js';

const goalSchema = new Schema<IGoal>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
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
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

goalSchema.pre<IGoal>('save', function (this: IGoal) {
  this.updated_at = new Date().toISOString();
});

export const Goal: Model<IGoal> = mongoose.model<IGoal>('Goal', goalSchema);
