import mongoose, { Schema, Model, Types } from 'mongoose';

export interface ITangibleAsset {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string | null;
  category: string | null;
  purchase_price: number | null;
  current_value: number | null;
  purchase_date: string | null;
  location: string | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  deleted_by_process: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const tangibleAssetSchema = new Schema<ITangibleAsset>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      default: null,
      maxlength: 5000,
    },

    category: {
      type: String,
      default: null,
      trim: true,
    },

    purchase_price: {
      type: Number,
      default: null,
    },

    current_value: {
      type: Number,
      default: null,
    },

    purchase_date: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      default: null,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    deleted_at: {
      type: Date,
      default: null,
    },

    deleted_by_process: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const TangibleAsset: Model<ITangibleAsset> =
  mongoose.model<ITangibleAsset>('TangibleAsset', tangibleAssetSchema);
