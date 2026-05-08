import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IProject } from '@/types/index.js';

const projectSchema = new Schema<IProject>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    business_id: { type: String, default: null },
    status: { type: String, default: 'pending' },
    priority: { type: String, default: 'medium' },
    start_date: { type: String, default: null },
    deadline: { type: String, default: null },
    client_id: { type: String, default: null },
    revenue_target: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

projectSchema.pre<IProject>('save', function (this: IProject) {
  this.updated_at = new Date().toISOString();
});

export const Project: Model<IProject> = mongoose.model<IProject>(
  'Project',
  projectSchema,
);
