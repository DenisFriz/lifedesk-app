import type { Request, Response } from 'express';
import { Subscription } from '@/models/index.js';

export async function analyzeSubscriptionDuplicates(
  req: Request,
  res: Response,
) {
  try {
    const subs = await Subscription.find()
      .lean()
      .select('stripe_subscription_id user_email created_at _id');

    const byStripeId: Record<string, any[]> = {};
    const byEmail: Record<string, any[]> = {};

    subs.forEach((sub) => {
      if (sub.stripe_subscription_id) {
        if (!byStripeId[sub.stripe_subscription_id]) {
          byStripeId[sub.stripe_subscription_id] = [];
        }
        byStripeId[sub.stripe_subscription_id].push(sub);
      }

      if (sub.user_email) {
        if (!byEmail[sub.user_email]) {
          byEmail[sub.user_email] = [];
        }
        byEmail[sub.user_email].push(sub);
      }
    });

    const duplicatesByStripeId = Object.entries(byStripeId).filter(
      ([, subs]) => subs.length > 1,
    );

    const duplicatesByEmail = Object.entries(byEmail).filter(
      ([, subs]) => subs.length > 1,
    );

    res.json({
      total_subscriptions: subs.length,

      duplicates_by_stripe_id: duplicatesByStripeId.map(([id, subs]) => ({
        stripe_subscription_id: id,
        count: subs.length,
        records: subs,
      })),

      duplicates_by_email: duplicatesByEmail.map(([email, subs]) => ({
        user_email: email,
        count: subs.length,
        records: subs,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
