import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IExpense {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  amount: number;
  date?: string | null;
  category?: string | null;
  business_id?: Types.ObjectId | null;
  bank_account_name?: string | null;
  notes: string;
  is_recurring: boolean;
  frequency?: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | null;
  start_date?: string | null;
  createdAt: string;
  updatedAt: string;
}

const expenseSchema = new Schema<IExpense>(
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
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    date: {
      type: String,
      default: null,
    },

    category: {
      type: String,
      default: null,
    },

    business_id: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    bank_account_name: {
      type: String,
      default: null,
    },

    notes: {
      type: String,
      default: '',
    },

    is_recurring: {
      type: Boolean,
      default: false,
    },

    frequency: {
      type: String,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
      default: null,
    },

    start_date: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Expense: Model<IExpense> = mongoose.model<IExpense>(
  'Expense',
  expenseSchema,
);
