import mongoose, { Schema, Model } from 'mongoose';
import { IEvent } from '@/types/index.js';

const eventSchema = new Schema<IEvent>(
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
    important: { type: Boolean, default: false },
    start_date: { type: String, default: null },
    start_time: { type: String, default: null },
    end_date: { type: String, default: null },
    end_time: { type: String, default: null },
    reminders: [Schema.Types.Mixed],
    status: { type: String, default: 'pending' },
    is_recurring: { type: Boolean, default: false },
    recurrence_frequency: { type: String, default: null },
    recurrence_interval: { type: Number, default: 1 },
    recurrence_days_of_week: [String],
    recurrence_end_type: { type: String, default: 'never' },
    recurrence_end_date: { type: String, default: null },
    recurrence_end_count: { type: Number, default: null },
    excluded_dates: [String],
    parent_recurring_event_id: { type: String, default: null },
    order: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const Event: Model<IEvent> = mongoose.model<IEvent>(
  'Event',
  eventSchema,
);
