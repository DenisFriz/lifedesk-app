import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IOfflineAccount {
  _id?: Types.ObjectId;
  created_by: Types.ObjectId;
  name: string;
  balance: number;
  currency: string;
  notes: string | null;
  is_deleted: boolean;
  deleted_at: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const offlineAccountSchema = new Schema<IOfflineAccount>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
    },

    currency: {
      type: String,
      required: true,
      default: 'EUR',
      enum: [
        'EUR',
        'USD',
        'GBP',
        'CHF',
        'CZK',
        'PLN',
        'HUF',
        'RON',
        'BGN',
        'DKK',
        'SEK',
        'NOK',
      ],
    },

    notes: {
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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const OfflineAccount: Model<IOfflineAccount> =
  mongoose.model<IOfflineAccount>('OfflineAccount', offlineAccountSchema);
