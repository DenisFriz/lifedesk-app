import mongoose, { Schema, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IIdea {
  _id?: Types.ObjectId;
  id: string;
  created_by: string;
  title: string;
  business_id: string | null;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  potential_impact: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process: string | null;
  created_at: string;
  updated_at: string;
}

const ideaSchema = new Schema<IIdea>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    title: { type: String, required: true },
    business_id: String,
    description: String,
    category: String,
    priority: { type: String, default: 'medium' },
    status: { type: String, default: 'pending' },
    potential_impact: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

ideaSchema.pre<IIdea>('save', function (this: IIdea) {
  this.updated_at = new Date().toISOString();
});

export const Idea: Model<IIdea> = mongoose.model<IIdea>('Idea', ideaSchema);
