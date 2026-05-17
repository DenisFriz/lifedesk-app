import mongoose, { HydratedDocument, Model, Schema, Types } from 'mongoose';

export interface IRefreshToken {
  user_id: Types.ObjectId;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
  user_agent?: string;
  ip?: string;
}

export type RefreshTokenDocument = HydratedDocument<IRefreshToken>;

const RefreshTokenSchema = new Schema<RefreshTokenDocument>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  token_hash: {
    type: String,
    required: true,
    unique: true,
  },

  expires_at: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },

  revoked: {
    type: Boolean,
    default: false,
  },

  created_at: {
    type: Date,
    default: () => new Date(),
  },

  user_agent: String,
  ip: String,
});

export const RefreshToken: Model<RefreshTokenDocument> =
  mongoose.model<RefreshTokenDocument>('RefreshToken', RefreshTokenSchema);
