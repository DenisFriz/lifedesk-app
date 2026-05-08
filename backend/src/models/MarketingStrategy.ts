import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IMarketingStrategy } from '@/types/index.js';

const marketingStrategySchema = new Schema<IMarketingStrategy>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    name: { type: String, required: true },
    business_id: String,
    main_goal: String,
    smart_specific: String,
    smart_measurable: String,
    smart_achievable: String,
    smart_relevant: String,
    smart_time_bound: String,
    target_audience: String,
    usp: String,
    core_message: String,
    main_channels: [String],
    notes: String,
    status: { type: String, default: 'draft' },
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

marketingStrategySchema.pre<IMarketingStrategy>(
  'save',
  function (this: IMarketingStrategy) {
    this.updated_at = new Date().toISOString();
  },
);

export const MarketingStrategy: Model<IMarketingStrategy> =
  mongoose.model<IMarketingStrategy>(
    'MarketingStrategy',
    marketingStrategySchema,
  );
