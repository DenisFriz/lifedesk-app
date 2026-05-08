import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IClient } from '@/types/index.js';

export const entityName = 'Client';

const clientSchema = new Schema<IClient>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },

    email: { type: String, default: null, index: true },
    phone: { type: String, default: null, index: true },
    company: { type: String, default: null },

    status: { type: String, default: 'lead', index: true },

    lifetime_value: { type: Number, default: null },

    notes: { type: String, default: null },

    business_id: { type: String, default: null, index: true },

    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },

    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

clientSchema.pre<IClient>('save', function () {
  this.updated_at = new Date().toISOString();
});

export const Client: Model<IClient> = mongoose.model<IClient>(
  'Client',
  clientSchema,
);
