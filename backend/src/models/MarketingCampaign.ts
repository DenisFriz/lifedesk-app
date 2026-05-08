import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IMarketingCampaign } from '@/types/index.js';

const marketingCampaignSchema = new Schema<IMarketingCampaign>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    name: { type: String, required: true },
    business_id: String,
    strategy_id: String,
    campaign_type: String,
    goal: String,
    channel: String,
    start_date: String,
    end_date: String,
    budget: Number,
    status: { type: String, default: 'draft' },
    kpis: [Schema.Types.Mixed],
    notes: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

marketingCampaignSchema.pre<IMarketingCampaign>(
  'save',
  function (this: IMarketingCampaign) {
    this.updated_at = new Date().toISOString();
  },
);

export const MarketingCampaign: Model<IMarketingCampaign> =
  mongoose.model<IMarketingCampaign>(
    'MarketingCampaign',
    marketingCampaignSchema,
  );
