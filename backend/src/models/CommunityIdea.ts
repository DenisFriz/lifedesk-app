import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ICommunityIdea {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string;
  category: 'new_feature' | 'optimization' | 'ui_ux' | 'bug_fix' | 'other';
  likes_count: number;
  comments_count: number;
  anonymous: boolean;
  liked_by: Types.ObjectId[];
  status: 'new' | 'under_review' | 'planned' | 'in_progress' | 'implemented';
  is_deleted: boolean;
  deleted_at?: string | null;
  deleted_by_process?: string | null;
  createdAt: string;
  updatedAt: string;
}

const communityIdeaSchema = new Schema<ICommunityIdea>(
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
      maxlength: 50,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      enum: ['new_feature', 'optimization', 'ui_ux', 'bug_fix', 'other'],
      default: 'new_feature',
    },

    likes_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    comments_count: {
      type: Number,
      default: 0,
      min: 0,
    },

    anonymous: {
      type: Boolean,
      default: false,
    },

    liked_by: {
      type: [Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    status: {
      type: String,
      enum: ['new', 'under_review', 'planned', 'in_progress', 'implemented'],
      default: 'new',
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

export const CommunityIdea: Model<ICommunityIdea> =
  mongoose.model<ICommunityIdea>('CommunityIdea', communityIdeaSchema);
