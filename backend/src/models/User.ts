import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import { encryptNullable, decryptNullable } from '@/utils/encryption.js';
import { IUser } from '@/types/index.js';

export type IUserDocument = HydratedDocument<IUser>;

const PlaidConnectionSchema = new Schema(
  {
    item_id: String,
    access_token: String,
    institution_name: String,
    connected_at: String,
  },
  { _id: false },
);

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, select: false },
    full_name: { type: String, default: null },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    subscription_tier: {
      type: String,
      enum: ['free', 'plus', 'pro'],
      default: 'free',
    },
    storage_used: { type: Number, default: 0 },
    image_count: { type: Number, default: 0 },
    auth_provider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    google_id: {
      type: String,
      unique: true,
      sparse: true,
    },
    google_avatar_url: {
      type: String,
      default: null,
    },
    profile_image_url: {
      type: String,
      default: null,
    },
    profile_image_public_id: {
      type: String,
      default: null,
    },
    email_verified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      default: null,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    plaid_connections: [PlaidConnectionSchema],
    terms_accepted_at: { type: String, default: null },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: String, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

UserSchema.pre('save', async function (this: HydratedDocument<IUser>) {
  if (this.isModified('plaid_connections')) {
    this.plaid_connections = this.plaid_connections.map((conn: any) => ({
      ...(conn.toObject?.() || conn),
      access_token: encryptNullable(conn.access_token) ?? conn.access_token,
    }));
  }
});

UserSchema.post<IUserDocument>(['find', 'findOne'], function (result: any) {
  if (!result) return;
  const docs = Array.isArray(result) ? result : [result];
  docs.filter(Boolean).forEach((doc: any) => {
    if (doc.plaid_connections) {
      doc.plaid_connections = doc.plaid_connections.map((conn: any) => ({
        ...conn,
        access_token: decryptNullable(conn.access_token) ?? conn.access_token,
      }));
    }
  });
});

export const User: Model<IUserDocument> = mongoose.model('User', UserSchema);
