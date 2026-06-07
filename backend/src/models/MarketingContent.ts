import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IMarketingContent {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  campaign_id?: Types.ObjectId | null;
  type: string;
  platform: string;
  status: string;
  publish_date?: string | null;
  cta?: string | null;
  asset_url?: string | null;
  description?: string | null;
  notes?: string | null;
  business_id?: Types.ObjectId | null;
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by_process?: string | null;
  createdAt: string;
  updatedAt: string;
}

const marketingContentSchema = new Schema<IMarketingContent>(
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
      maxlength: 300,
    },

    campaign_id: {
      type: Schema.Types.ObjectId,
      ref: 'MarketingCampaign',
      default: null,
    },

    type: {
      type: String,
      default: 'social_post',
    },

    platform: {
      type: String,
      default: 'instagram',
    },

    status: {
      type: String,
      default: 'idea',
    },

    publish_date: {
      type: String,
      default: null,
    },

    cta: {
      type: String,
      default: null,
      maxlength: 500,
    },

    asset_url: {
      type: String,
      default: null,
    },

    description: {
      type: String,
      default: null,
      maxlength: 5000,
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

export const MarketingContent: Model<IMarketingContent> =
  mongoose.model<IMarketingContent>('MarketingContent', marketingContentSchema);
