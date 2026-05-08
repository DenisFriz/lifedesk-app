import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { encryptNullable, decryptNullable } from '@utils/encryption.js';
import { IMedicalDocument } from '@/types/index.js';

const MedicalDocumentSchema = new Schema<IMedicalDocument>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, required: true, index: true },
    title: String,
    type: String,
    description: {
      type: String,
      default: null,
      set: encryptNullable,
      get: decryptNullable,
    },
    summary: {
      type: String,
      default: null,
      set: encryptNullable,
      get: decryptNullable,
    },
    date: String,
    url: {
      type: String,
      default: null,
      set: encryptNullable,
      get: decryptNullable,
    },
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

MedicalDocumentSchema.pre<IMedicalDocument>(
  'save',
  function (this: IMedicalDocument) {
    this.updated_at = new Date().toISOString();
  },
);

export const MedicalDocument: Model<IMedicalDocument> =
  mongoose.model<IMedicalDocument>('MedicalDocument', MedicalDocumentSchema);
