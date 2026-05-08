import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ILearningItem } from '@/types/index.js';

const learningItemSchema = new Schema<ILearningItem>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    title: { type: String, required: true },
    type: { type: String, default: null },
    status: { type: String, default: 'pending' },
    progress: { type: Number, default: 0 },
    description: { type: String, default: null },
    url: { type: String, default: null },
    skill_category: { type: String, default: null },
    priority: { type: String, default: null },
    start_date: { type: String, default: null },
    completed_date: { type: String, default: null },
    time_invested_hours: { type: Number, default: 0 },
    rating: { type: Number, default: null },
    key_takeaways: { type: String, default: null },
    author: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

learningItemSchema.pre<ILearningItem>('save', function (this: ILearningItem) {
  this.updated_at = new Date().toISOString();
});

export const LearningItem: Model<ILearningItem> = mongoose.model<ILearningItem>(
  'LearningItem',
  learningItemSchema,
);
