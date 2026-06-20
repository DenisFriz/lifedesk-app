import mongoose, { Schema, Model, HydratedDocument, Types } from 'mongoose';

interface ISubscription {
  _id?: Types.ObjectId;
  id: string;
  user_id: Types.ObjectId;
  user_email: string;
  plan_name: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export type ISubscriptionDocument = HydratedDocument<ISubscription>;

const SubscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    user_email: { type: String, required: true },
    plan_name: {
      type: String,
      enum: ['free', 'plus', 'pro'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'active',
        'canceled',
        'past_due',
        'incomplete',
        'incomplete_expired',
        'trialing',
        'unpaid',
        'paused',
      ],
      required: true,
    },
    stripe_customer_id: { type: String, default: null },
    stripe_subscription_id: { type: String, default: null },
    current_period_start: { type: String, default: null },
    current_period_end: { type: String, default: null },
    cancel_at_period_end: { type: Boolean, default: false },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: false, versionKey: false },
);

SubscriptionSchema.pre('save', function (this: ISubscriptionDocument) {
  this.updated_at = new Date().toISOString();
});

SubscriptionSchema.index({ user_email: 1 });
SubscriptionSchema.index({ stripe_subscription_id: 1 });

export const Subscription: Model<ISubscriptionDocument> =
  mongoose.model<ISubscriptionDocument>('Subscription', SubscriptionSchema);
