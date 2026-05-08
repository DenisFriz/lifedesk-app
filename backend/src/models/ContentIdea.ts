import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IContentIdea } from '@/types/index.js';

const contentIdeaSchema = new Schema<IContentIdea>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    title: { type: String, required: true },
    business_id: String,
    campaign_id: String,
    description: String,
    type: String,
    platform: String,
    status: { type: String, default: 'draft' },
    publish_date: String,
    cta: String,
    asset_url: String,
    notes: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

contentIdeaSchema.pre<IContentIdea>('save', function (this: IContentIdea) {
  this.updated_at = new Date().toISOString();
});

export const ContentIdea: Model<IContentIdea> = mongoose.model<IContentIdea>(
  'ContentIdea',
  contentIdeaSchema,
);
