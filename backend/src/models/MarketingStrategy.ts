import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IMarketingStrategy {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  main_goal?: string | null;
  smart_specific?: string | null;
  smart_measurable?: string | null;
  smart_achievable?: string | null;
  smart_relevant?: string | null;
  smart_time_bound?: string | null;
  target_audience?: string | null;
  usp?: string | null;
  core_message?: string | null;
  main_channels: string[];
  notes?: string | null;
  status: 'draft' | 'active' | 'paused' | 'completed';
  business_id?: Types.ObjectId | null;
  goal_id?: Types.ObjectId | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by_process?: string | null;
  createdAt: string;
  updatedAt: string;
}

const marketingStrategySchema = new Schema<IMarketingStrategy>(
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

    main_goal: {
      type: String,
      default: null,
      maxlength: 1000,
    },

    smart_specific: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    smart_measurable: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    smart_achievable: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    smart_relevant: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    smart_time_bound: {
      type: String,
      default: null,
      maxlength: 2000,
    },

    target_audience: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    usp: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    core_message: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    main_channels: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      default: null,
      maxlength: 10000,
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'completed'],
      default: 'draft',
    },

    business_id: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
      default: null,
    },

    goal_id: {
      type: Schema.Types.ObjectId,
      ref: 'Goal',
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

export const MarketingStrategy: Model<IMarketingStrategy> =
  mongoose.model<IMarketingStrategy>(
    'MarketingStrategy',
    marketingStrategySchema,
  );
