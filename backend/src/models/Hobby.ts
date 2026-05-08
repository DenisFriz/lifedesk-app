import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IHobby } from '@/types/index.js';

const hobbySchema = new Schema<IHobby>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    title: { type: String, required: true },
    category: { type: String, default: null },
    description: { type: String, default: null },
    skill_level: { type: String, default: 'beginner' },
    status: { type: String, default: 'active' },
    started_date: { type: String, default: null },
    frequency: { type: String, default: null },
    avg_session_minutes: { type: Number, default: null },
    equipment: { type: String, default: null },
    color: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

hobbySchema.pre<IHobby>('save', function (this: IHobby) {
  this.updated_at = new Date().toISOString();
});

export const Hobby: Model<IHobby> = mongoose.model<IHobby>(
  'Hobby',
  hobbySchema,
);
