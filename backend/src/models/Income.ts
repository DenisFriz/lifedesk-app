import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IIncome } from '@/types/index.js';
import { encrypt, decrypt } from '@utils/encryption.js';

const incomeSchema = new Schema<IIncome>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    amount: {
      type: String,
      default: null,
      set: (v: number | null) => (v != null ? encrypt(String(v)) : null),
      get: (v: string | null) => (v != null ? parseFloat(decrypt(v)) : null),
    },
    category: String,
    description: {
      type: String,
      default: null,
      set: (v: string | null) => (v != null ? encrypt(v) : null),
      get: (v: string | null) => (v != null ? decrypt(v) : null),
    },
    date: String,
    notes: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
    versionKey: false,
    toObject: { getters: true },
    toJSON: { getters: true },
  },
);

incomeSchema.pre<IIncome>('save', function (this: IIncome) {
  this.updated_at = new Date().toISOString();
});

export const Income: Model<IIncome> = mongoose.model<IIncome>(
  'Income',
  incomeSchema,
);
