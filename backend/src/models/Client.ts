import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IClient {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  status: 'lead' | 'active' | 'inactive' | 'past';
  notes?: string | null;
  business_id?: Types.ObjectId | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by_process?: string | null;
  createdAt: string;
  updatedAt: string;
}

const clientSchema = new Schema<IClient>(
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

    company: {
      type: String,
      default: null,
      trim: true,
      maxlength: 200,
    },

    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: null,
      trim: true,
      maxlength: 50,
    },

    status: {
      type: String,
      enum: ['lead', 'active', 'inactive', 'past'],
      default: 'lead',
    },

    notes: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    business_id: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: String,
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

export const Client: Model<IClient> = mongoose.model<IClient>(
  'Client',
  clientSchema,
);
