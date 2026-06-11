import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ICalculationHistory {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  created_date: string;
  type: 'calculator' | 'converter';
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by_process?: string | null;
  createdAt: string;
  updatedAt: string;
}

const calculationHistorySchema = new Schema<ICalculationHistory>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    created_date: {
      type: String,
      default: () => new Date().toISOString(),
    },

    type: {
      type: String,
      enum: ['calculator', 'converter'],
      required: true,
    },

    inputs: {
      type: Schema.Types.Mixed,
      default: {},
    },

    outputs: {
      type: Schema.Types.Mixed,
      default: {},
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

export const CalculationHistory: Model<ICalculationHistory> = mongoose.model<ICalculationHistory>(
  'CalculationHistory',
  calculationHistorySchema,
);
