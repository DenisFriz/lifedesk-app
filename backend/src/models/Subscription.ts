import mongoose, { Schema, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { ISubscription } from '@/types/index.js';

const subscriptionSchema = new Schema<ISubscription>(
  {
    id: { type: String, default: () => uuidv4(), unique: true, index: true },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_email: { type: String, required: true },
    plan_name: { type: String, required: true },
    status: { type: String, required: true },
    stripe_customer_id: String,
    stripe_subscription_id: String,
    current_period_start: String,
    current_period_end: String,
    cancel_at_period_end: { type: Boolean, default: false },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

subscriptionSchema.pre<ISubscription>('save', function (this: ISubscription) {
  this.updated_at = new Date().toISOString();
});

subscriptionSchema.index({ user_email: 1 });
subscriptionSchema.index({ stripe_subscription_id: 1 });

export const Subscription: Model<ISubscription> = mongoose.model<ISubscription>(
  'Subscription',
  subscriptionSchema,
);
