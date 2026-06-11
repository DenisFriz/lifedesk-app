import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ICommunityVote {
  _id: Types.ObjectId;
  idea_id: Types.ObjectId;
  created_by: Types.ObjectId;
  user_email: string;
  createdAt: Date;
  updatedAt: Date;
}

const communityVoteSchema = new Schema<ICommunityVote>(
  {
    idea_id: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityIdea',
      required: true,
      index: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Prevent a user from voting on the same idea twice
communityVoteSchema.index({ idea_id: 1, user_email: 1 }, { unique: true });

export const CommunityVote: Model<ICommunityVote> =
  mongoose.model<ICommunityVote>('CommunityVote', communityVoteSchema);
