import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ITimeEntry {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  date: string;
  start_time: string;
  end_time?: string | null;
  duration?: number | null;
  description: string;
  notes?: string | null;
  section_id?: string | null;
  client_id?: Types.ObjectId | null;
  project_id?: Types.ObjectId | null;
  is_running: boolean;
  is_deleted: boolean;
  deleted_at?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    date: {
      type: String,
      required: true,
      index: true,
    },

    start_time: {
      type: String,
      required: true,
    },

    end_time: {
      type: String,
      default: null,
    },

    duration: {
      type: Number,
      default: null,
      min: 0,
    },

    description: {
      type: String,
      default: '',
      maxlength: 1000,
    },

    notes: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    section_id: {
      type: String,
      default: null,
      index: true,
    },

    client_id: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },

    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },

    is_running: {
      type: Boolean,
      default: false,
      index: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    deleted_at: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TimeEntry: Model<ITimeEntry> = mongoose.model(
  'TimeEntry',
  timeEntrySchema,
);
