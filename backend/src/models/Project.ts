import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IProject {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  description: string | null;
  business_id: Types.ObjectId | null;
  client_id: Types.ObjectId | null;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  start_date: string | null;
  deadline: string | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  deleted_by_process: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const projectSchema = new Schema<IProject>(
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

    description: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    business_id: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },

    status: {
      type: String,
      enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
    },

    start_date: {
      type: String,
      default: null,
    },

    deadline: {
      type: String,
      default: null,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: Date,
      default: null,
    },

    deleted_by_process: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Project: Model<IProject> = mongoose.model<IProject>(
  'Project',
  projectSchema,
);
