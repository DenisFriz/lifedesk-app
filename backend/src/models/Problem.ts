import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IProblem {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  business_id?: Types.ObjectId | null;
  problem_type?: string;
  goal_id?: Types.ObjectId | null;
  resolved: boolean;
  resolved_at?: string | null;
  category?: string | null;
  status: 'active' | 'resolved' | 'archived';
  important: boolean;
  show_in_timeline: boolean;
  is_deleted: boolean;
  deleted_at?: string | null;
  date_occurred?: string | null;
  date_ended?: string | null;
  createdAt: string;
  updatedAt: string;
}

const problemSchema = new Schema<IProblem>(
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
      maxlength: 200,
    },

    description: {
      type: String,
      default: '',
      maxlength: 5000,
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },

    business_id: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    problem_type: {
      type: String,
      default: '',
    },

    goal_id: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },

    resolved: {
      type: Boolean,
      default: false,
    },

    resolved_at: {
      type: String,
      default: null,
    },

    category: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ['active', 'resolved', 'archived'],
      default: 'active',
    },

    important: {
      type: Boolean,
      default: false,
    },

    show_in_timeline: {
      type: Boolean,
      default: false,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: String,
      default: null,
    },

    date_occurred: {
      type: String,
      default: null,
    },

    date_ended: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Problem: Model<IProblem> = mongoose.model<IProblem>(
  'Problem',
  problemSchema,
);
