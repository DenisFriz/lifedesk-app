import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IRecurringIncome {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  amount: number;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: Date;
  category: string | null;
  active: boolean;
  business_id: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const recurringIncomeSchema = new Schema<IRecurringIncome>(
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

    active: {
      type: Boolean,
      default: true,
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

export const RecurringIncome: Model<IRecurringIncome> =
  mongoose.model<IRecurringIncome>('RecurringIncome', recurringIncomeSchema);
