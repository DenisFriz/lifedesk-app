import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ICommunityIdea } from '@/types/index.js';

const CommunityIdeaSchema = new Schema<ICommunityIdea>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },

    created_by: { type: String, required: true, index: true },

    title: {
      type: String,
      required: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: null,
      maxlength: 3000,
    },

    category: {
      type: String,
      required: true,
      enum: ['new_feature', 'optimization', 'ui_ux', 'bug_fix', 'other'],
    },

    status: {
      type: String,
      enum: [
        'new',
        'under_review',
        'planned',
        'in_progress',
        'implemented',
        'rejected',
      ],
      default: 'new',
    },

    likes_count: {
      type: Number,
      default: 0,
    },

    comments_count: {
      type: Number,
      default: 0,
    },

    anonymous: {
      type: Boolean,
      default: false,
    },

    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: String, default: null },
    deleted_by_process: { type: String, default: null },

    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
    versionKey: false,
  },
);

CommunityIdeaSchema.pre<ICommunityIdea>('save', function () {
  this.updated_at = new Date().toISOString();
});

export const CommunityIdea: Model<ICommunityIdea> =
  mongoose.model<ICommunityIdea>('CommunityIdea', CommunityIdeaSchema);
