import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IOfflineAccountSnapshot {
  _id: Types.ObjectId;
  created_by: Types.ObjectId;
  account_id: Types.ObjectId;
  currency: string;
  date: Date;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const offlineAccountSnapshotSchema = new Schema<IOfflineAccountSnapshot>(
  {
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    account_id: {
      type: Schema.Types.ObjectId,
      ref: 'OfflineAccount',
      required: true,
      index: true,
    },

    currency: {
      type: String,
      required: true,
      default: 'EUR',
    },

    date: {
      type: Date,
      required: true,
    },

    balance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const OfflineAccountSnapshot: Model<IOfflineAccountSnapshot> =
  mongoose.model<IOfflineAccountSnapshot>(
    'OfflineAccountSnapshot',
    offlineAccountSnapshotSchema,
  );
