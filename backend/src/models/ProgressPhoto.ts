import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { encryptNullable, decryptNullable } from '@utils/encryption.js';
import { IProgressPhoto } from '@/types/index.js';

const ProgressPhotoSchema = new Schema<IProgressPhoto>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, required: true, index: true },
    url: {
      type: String,
      default: null,
      set: encryptNullable,
      get: decryptNullable,
    },
    date: String,
    notes: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
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

ProgressPhotoSchema.pre<IProgressPhoto>(
  'save',
  function (this: IProgressPhoto) {
    this.updated_at = new Date().toISOString();
  },
);

export const ProgressPhoto: Model<IProgressPhoto> =
  mongoose.model<IProgressPhoto>('ProgressPhoto', ProgressPhotoSchema);
