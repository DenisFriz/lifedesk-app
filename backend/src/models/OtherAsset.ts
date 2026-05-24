import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IOtherAsset {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  title: string;
  description: string;
  category: 'jewelry' | 'art' | 'electronics' | 'other' | null;
  purchase_price: number | null;
  current_value: number | null;
  purchase_date: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const otherAssetSchema = new Schema<IOtherAsset>(
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
      default: '',
      maxlength: 5000,
    },

    category: {
      type: String,
      enum: ['jewelry', 'art', 'electronics', 'other'],
      default: 'other',
    },

    purchase_price: {
      type: Number,
      default: null,
      min: 0,
    },

    current_value: {
      type: Number,
      default: null,
      min: 0,
    },

    purchase_date: {
      type: String,
      default: null,
    },

    location: {
      type: String,
      default: null,
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const OtherAsset: Model<IOtherAsset> = mongoose.model<IOtherAsset>(
  'OtherAsset',
  otherAssetSchema,
);
