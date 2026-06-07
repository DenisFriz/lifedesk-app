import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IMarketingCampaign {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  strategy_id?: Types.ObjectId | null;
  campaign_type: string; // e.g. social_media, email, ads, seo
  goal?: string | null;
  channel?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  kpis: {
    name: string;
    target: string;
    actual: string;
  }[];
  notes?: string | null;
  business_id?: Types.ObjectId | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by_process?: string | null;
  createdAt: string;
  updatedAt: string;
}

const kpiSchema = new Schema(
  {
    name: { type: String, required: true },
    target: { type: String, default: '' },
    actual: { type: String, default: '' },
  },
  { _id: false },
);

const marketingCampaignSchema = new Schema<IMarketingCampaign>(
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

    strategy_id: {
      type: Schema.Types.ObjectId,
      ref: 'MarketingStrategy',
      default: null,
    },

    campaign_type: {
      type: String,
      required: true,
      default: 'social_media',
    },

    goal: {
      type: String,
      default: null,
    },

    channel: {
      type: String,
      default: null,
    },

    start_date: {
      type: String,
      default: null,
    },

    end_date: {
      type: String,
      default: null,
    },

    budget: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ['planned', 'active', 'paused', 'completed', 'cancelled'],
      default: 'planned',
    },

    kpis: {
      type: [kpiSchema],
      default: [],
    },

    notes: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    business_id: {
      type: Schema.Types.ObjectId,
      ref: 'Business',
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

export const MarketingCampaign: Model<IMarketingCampaign> =
  mongoose.model<IMarketingCampaign>(
    'MarketingCampaign',
    marketingCampaignSchema,
  );
