import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { Subscription } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type DebugSubscriptionByEmailBody = {
  email: string;
};

export async function debugSubscriptionByEmail(
  req: Request<unknown, unknown, DebugSubscriptionByEmailBody>,
  res: Response,
) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'email required' });
    }

    const subs = await Subscription.find({ user_email: email })
      .lean()
      .select('stripe_subscription_id plan_name status cancel_at_period_end');
    const results: any[] = [];

    for (const sub of subs) {
      if (sub.stripe_subscription_id) {
        try {
          const stripeSub = await stripe.subscriptions.retrieve(
            sub.stripe_subscription_id,
          );
          results.push({
            local: {
              plan_name: sub.plan_name,
              status: sub.status,
              cancel_at_period_end: sub.cancel_at_period_end,
            },
            stripe: {
              status: stripeSub.status,
              cancel_at_period_end: stripeSub.cancel_at_period_end,
            },
            match:
              sub.status === stripeSub.status &&
              sub.cancel_at_period_end === stripeSub.cancel_at_period_end,
          });
        } catch {
          results.push({
            stripe_subscription_id: sub.stripe_subscription_id,
            error: 'Not found in Stripe',
          });
        }
      }
    }

    res.json({ email, subscriptions: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
