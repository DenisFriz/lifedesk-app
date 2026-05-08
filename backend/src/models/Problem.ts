import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IProblem } from '@/types/index.js';

const problemSchema = new Schema<IProblem>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    category: { type: String, default: null },
    problem_type: { type: String, default: null },
    business_id: { type: String, default: null },
    important: { type: Boolean, default: false },
    show_in_timeline: { type: Boolean, default: true },
    date_occurred: { type: String, default: null },
    date_ended: { type: String, default: null },
    status: { type: String, default: 'pending' },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

problemSchema.pre<IProblem>('save', function (this: IProblem) {
  this.updated_at = new Date().toISOString();
});

export const Problem: Model<IProblem> = mongoose.model<IProblem>(
  'Problem',
  problemSchema,
);
