import mongoose, { Schema, Model, Types } from 'mongoose';

export interface IPushSubscription {
  _id?: Types.ObjectId;
  user_id: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  user_agent: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    user_agent: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const PushSubscription: Model<IPushSubscription> = mongoose.model<IPushSubscription>(
  'PushSubscription',
  pushSubscriptionSchema,
);
