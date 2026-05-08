import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  encrypt,
  decrypt,
  encryptNullable,
  decryptNullable,
} from '@utils/encryption.js';
import { IBankBalanceSnapshot } from '@/types/index.js';

const BankBalanceSnapshotSchema = new Schema<IBankBalanceSnapshot>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, required: true, index: true },
    date: String,
    account_id: {
      type: String,
      default: null,
      set: encryptNullable,
      get: decryptNullable,
    },
    account_name: String,
    institution_name: String,
    balance: {
      type: String,
      default: null,
      set: (v: number | null) => (v != null ? encrypt(String(v)) : null),
      get: (v: string | null) => (v != null ? parseFloat(decrypt(v)) : null),
    },
    available: {
      type: String,
      default: null,
      set: (v: number | null) => (v != null ? encrypt(String(v)) : null),
      get: (v: string | null) => (v != null ? parseFloat(decrypt(v)) : null),
    },
    currency: { type: String, default: 'EUR' },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  {
    timestamps: false,
    versionKey: false,
    toObject: { getters: true },
    toJSON: { getters: true },
  },
);

BankBalanceSnapshotSchema.index({ date: 1, created_by: 1 });
BankBalanceSnapshotSchema.pre<IBankBalanceSnapshot>(
  'save',
  function (this: IBankBalanceSnapshot) {
    this.updated_at = new Date().toISOString();
  },
);

export const BankBalanceSnapshot: Model<IBankBalanceSnapshot> =
  mongoose.model<IBankBalanceSnapshot>(
    'BankBalanceSnapshot',
    BankBalanceSnapshotSchema,
  );
