import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IRecurringExpense {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: Date;
  category: string | null;
  business_id: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const recurringExpenseSchema = new Schema<IRecurringExpense>(
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

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    frequency: {
      type: String,
      required: true,
      enum: ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },

    start_date: {
      type: Date,
      required: true,
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const RecurringExpense: Model<IRecurringExpense> =
  mongoose.model<IRecurringExpense>('RecurringExpense', recurringExpenseSchema);
