import mongoose, { Schema, Model } from 'mongoose';
import { Types } from 'mongoose';

export interface IHobby {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  category:
    | 'music'
    | 'arts_crafts'
    | 'sports_outdoor'
    | 'gaming'
    | 'cooking_food'
    | 'reading_writing'
    | 'technology'
    | 'collecting'
    | 'travel'
    | 'other';
  description: string | null;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  status: 'active' | 'on_pause' | 'want_to_start' | 'retired';
  started_date: Date | null;
  frequency:
    | 'daily'
    | 'few_times_week'
    | 'weekly'
    | 'monthly'
    | 'occasionally'
    | null;
  avg_session_minutes: number | null;
  equipment: string | null;
  color:
    | 'purple'
    | 'pink'
    | 'blue'
    | 'green'
    | 'orange'
    | 'amber'
    | 'rose'
    | 'teal'
    | 'indigo'
    | 'cyan';
  is_deleted: boolean;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const hobbySchema = new Schema<IHobby>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    category: {
      type: String,
      enum: [
        'music',
        'arts_crafts',
        'sports_outdoor',
        'gaming',
        'cooking_food',
        'reading_writing',
        'technology',
        'collecting',
        'travel',
        'other',
      ],
      required: true,
    },

    description: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    skill_level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner',
    },

    status: {
      type: String,
      enum: ['active', 'on_pause', 'want_to_start', 'retired'],
      default: 'active',
    },

    started_date: {
      type: Date,
      default: null,
    },

    frequency: {
      type: String,
      enum: ['daily', 'few_times_week', 'weekly', 'monthly', 'occasionally'],
      default: null,
    },

    avg_session_minutes: {
      type: Number,
      default: null,
      min: 0,
    },

    equipment: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    color: {
      type: String,
      enum: [
        'purple',
        'pink',
        'blue',
        'green',
        'orange',
        'amber',
        'rose',
        'teal',
        'indigo',
        'cyan',
      ],
      default: 'purple',
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Hobby: Model<IHobby> = mongoose.model<IHobby>(
  'Hobby',
  hobbySchema,
);
