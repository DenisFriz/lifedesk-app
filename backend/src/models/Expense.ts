import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IExpense } from '@/types/index.js';
import { encrypt, decrypt } from '@utils/encryption.js';

const expenseSchema = new Schema<IExpense>(
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

expenseSchema.pre<IExpense>('save', function (this: IExpense) {
  this.updated_at = new Date().toISOString();
});

export const Expense: Model<IExpense> = mongoose.model<IExpense>(
  'Expense',
  expenseSchema,
);
