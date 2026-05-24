import mongoose, { Schema, Model } from 'mongoose';
import { ILearning } from '@/types/index.js';

const learningSchema = new Schema<ILearning>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'course',
        'book',
        'skill',
        'podcast',
        'video',
        'certification',
        'article',
        'other',
      ],
      default: 'course',
    },
    status: {
      type: String,
      enum: ['want_to_learn', 'in_progress', 'completed', 'on_hold'],
      default: 'want_to_learn',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    description: { type: String, default: null },
    url: { type: String, default: null },
    skill_category: { type: String, default: null },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium',
    },
    start_date: { type: Date, default: null },
    completed_date: { type: Date, default: null },
    time_invested_hours: {
      type: Number,
      min: 0,
      default: 0,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    key_takeaways: { type: String, default: null },
    author: { type: String, default: null },
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_by_process: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const Learning: Model<ILearning> = mongoose.model<ILearning>(
  'Learning',
  learningSchema,
);
