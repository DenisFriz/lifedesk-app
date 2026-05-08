import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ICommunityComment } from '@/types/index.js';

const communityCommentSchema = new Schema<ICommunityComment>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    idea_id: String,
    content: String,
    author_display_name: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

communityCommentSchema.pre<ICommunityComment>(
  'save',
  function (this: ICommunityComment) {
    this.updated_at = new Date().toISOString();
  },
);

export const CommunityComment: Model<ICommunityComment> =
  mongoose.model<ICommunityComment>('CommunityComment', communityCommentSchema);
