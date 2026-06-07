import mongoose, { Schema, Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ITangibleAsset } from '@/types/index.js';

const tangibleAssetSchema = new Schema<ITangibleAsset>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    category: String,
    current_value: Number,
    purchase_date: String,
    purchase_price: Number,
    description: String,
    notes: String,
    is_deleted: { type: Boolean, default: false },
    deleted_at: String,
    deleted_by_process: String,
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

tangibleAssetSchema.pre<ITangibleAsset>(
  'save',
  function (this: ITangibleAsset) {
    this.updated_at = new Date().toISOString();
  },
);

export const TangibleAsset: Model<ITangibleAsset> =
  mongoose.model<ITangibleAsset>('TangibleAsset', tangibleAssetSchema);
