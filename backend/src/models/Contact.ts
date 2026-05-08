import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IContact } from '@/types/index.js';

export const entityName = 'Contact';

const contactSchema = new Schema<IContact>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },

    relationship: { type: String, default: null },
    avatar_color: { type: String, default: null },
    birthday: { type: String, default: null },
    phone: { type: String, default: null, index: true },
    email: { type: String, default: null, index: true },
    location: { type: String, default: null },
    notes: { type: String, default: null },

    interests: { type: [String], default: [] },

    check_in_frequency: { type: String, default: null },
    last_contact_date: { type: String, default: null },

    status: { type: String, default: 'active', index: true },

    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },

    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

contactSchema.pre<IContact>('save', function () {
  this.updated_at = new Date().toISOString();
});

export const Contact: Model<IContact> = mongoose.model<IContact>(
  'Contact',
  contactSchema,
);
