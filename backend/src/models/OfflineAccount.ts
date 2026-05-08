import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IOfflineAccount } from '@/types/index.js';

const offlineAccountSchema = new Schema<IOfflineAccount>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, index: true, required: true },
    name: { type: String, required: true },
    balance: Number,
    currency: { type: String, default: 'USD' },
    notes: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

offlineAccountSchema.pre<IOfflineAccount>(
  'save',
  function (this: IOfflineAccount) {
    this.updated_at = new Date().toISOString();
  },
);

export const OfflineAccount: Model<IOfflineAccount> =
  mongoose.model<IOfflineAccount>('OfflineAccount', offlineAccountSchema);
