import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ITask {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string | null;
  category: string | null;
  business_id: Types.ObjectId | null;
  problem_id: Types.ObjectId | null;
  goal_id: Types.ObjectId | null;
  important: boolean;
  due_date: Date | null;
  due_time: string | null;
  reminders: any[];
  status: string;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  recurrence_interval: number;
  recurrence_days_of_week: string[];
  recurrence_monthly_type: string;
  recurrence_end_type: string;
  recurrence_end_date: Date | null;
  recurrence_end_count: number | null;
  excluded_dates: Date[];
  parent_recurring_task_id: Types.ObjectId | null;
  order: number | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  deleted_by_process: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const taskSchema = new Schema<ITask>(
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
    goal_id: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    important: { type: Boolean, default: false },
    due_date: { type: String, default: null },
    due_time: { type: String, default: null },
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
    parent_recurring_task_id: { type: String, default: null },
    order: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema);
