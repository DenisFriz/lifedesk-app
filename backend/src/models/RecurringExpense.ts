import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IRecurringExpense } from '@/types/index.js';
import { encrypt, decrypt } from '@utils/encryption.js';

const recurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    title: { type: String, required: true },
    amount: {
      type: String,
      default: null,
      set: (v: number | null) => (v != null ? encrypt(String(v)) : null),
      get: (v: string | null) => (v != null ? parseFloat(decrypt(v)) : null),
    },
    category: String,
    description: String,
    frequency: String,
    start_date: String,
    end_date: String,
    active: { type: Boolean, default: true },
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

recurringExpenseSchema.pre<IRecurringExpense>(
  'save',
  function (this: IRecurringExpense) {
    this.updated_at = new Date().toISOString();
  },
);

export const RecurringExpense: Model<IRecurringExpense> =
  mongoose.model<IRecurringExpense>('RecurringExpense', recurringExpenseSchema);
