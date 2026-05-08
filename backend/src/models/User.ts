import mongoose, { Schema, Document, Model, HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
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
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    full_name: { type: String },
    role: { type: String, default: 'user' },
    subscription_tier: { type: String, default: 'free' },
    storage_used: { type: Number, default: 0 },
    image_count: { type: Number, default: 0 },
    plaid_connections: [PlaidConnectionSchema],
    terms_accepted_at: { type: String, default: null },
    terms_accepted_version: { type: String, default: null },
    is_deleted: { type: Boolean, default: false, index: true },
    deleted_at: { type: String, default: null },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: false, versionKey: false },
);

UserSchema.pre('save', async function (this: HydratedDocument<IUser>) {
  if (this.isModified('plaid_connections')) {
    this.plaid_connections = this.plaid_connections.map((conn: any) => ({
      ...(conn.toObject?.() || conn),
      access_token: encryptNullable(conn.access_token) ?? conn.access_token,
    }));
  }
  this.updated_at = new Date().toISOString();
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
