import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITimeEntry } from '@/types/index.js';

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    project_id: String,
    task_id: String,
    duration_minutes: Number,
    description: String,
    date: String,
    notes: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

timeEntrySchema.pre<ITimeEntry>('save', function (this: ITimeEntry) {
  this.updated_at = new Date().toISOString();
});

export const TimeEntry: Model<ITimeEntry> = mongoose.model<ITimeEntry>(
  'TimeEntry',
  timeEntrySchema,
);
