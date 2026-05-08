import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { encrypt, decrypt } from '@utils/encryption.js';
import { IBodyMeasurement } from '@/types/index.js';

const BodyMeasurementSchema = new Schema<IBodyMeasurement>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: String, required: true, index: true },
    weight: {
      type: String,
      default: null,
      set: (v: number | null) => (v != null ? encrypt(String(v)) : null),
      get: (v: string | null) => (v != null ? parseFloat(decrypt(v)) : null),
    },
    body_fat_percentage: {
      type: String,
      default: null,
      set: (v: number | null) => (v != null ? encrypt(String(v)) : null),
      get: (v: string | null) => (v != null ? parseFloat(decrypt(v)) : null),
    },
    waist: {
      type: String,
      default: null,
      set: (v: number | null) => (v != null ? encrypt(String(v)) : null),
      get: (v: string | null) => (v != null ? parseFloat(decrypt(v)) : null),
    },
    notes: String,
    date: String,
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

BodyMeasurementSchema.pre<IBodyMeasurement>(
  'save',
  function (this: IBodyMeasurement) {
    this.updated_at = new Date().toISOString();
  },
);

export const BodyMeasurement: Model<IBodyMeasurement> =
  mongoose.model<IBodyMeasurement>('BodyMeasurement', BodyMeasurementSchema);
