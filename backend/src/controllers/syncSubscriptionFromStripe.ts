import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { Subscription } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const toISO = (ts: unknown): string | null => {
  if (typeof ts === 'number' && !isNaN(ts) && ts > 0) {
    return new Date(ts * 1000).toISOString();
  }
  return null;
};

export async function syncSubscriptionFromStripe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const customers = await stripe.customers.list({
      email: req.user.email,
      limit: 100,
    });

    if (customers.data.length === 0) {
      return res
        .status(404)
        .json({ error: 'No Stripe customer found for this email' });
    }

    const results: any[] = [];

    for (const customer of customers.data) {
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 100,
      });

      for (const sub of stripeSubscriptions.data) {
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plusPriceId = process.env.STRIPE_PLUS_PRICE_ID;
        const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
        let plan_name: string | null = null;
        if (priceId === plusPriceId) plan_name = 'plus';
        else if (priceId === proPriceId) plan_name = 'pro';

        const subscriptionData = {
          user_id: req.user.id,
          user_email: req.user.email,
          plan_name: plan_name || 'free',
          status: sub.status,
          stripe_customer_id: customer.id,
          stripe_subscription_id: sub.id,
          current_period_start: toISO(sub.current_period_start),
          current_period_end: toISO(sub.current_period_end),
          cancel_at_period_end: sub.cancel_at_period_end,
        };

        const existing = await Subscription.findOne({
          stripe_subscription_id: sub.id,
        }).lean();

        if (existing) {
          await Subscription.findOneAndUpdate(
            { stripe_subscription_id: sub.id },
            { $set: subscriptionData },
            { new: true },
          );
          results.push({
            action: 'updated',
            stripe_subscription_id: sub.id,
            data: subscriptionData,
          });
        } else {
          await Subscription.create(subscriptionData);
          results.push({
            action: 'created',
            stripe_subscription_id: sub.id,
            data: subscriptionData,
          });
        }
      }
    }

    res.json({
      user_email: req.user.email,
      synced_subscriptions: results,
      total: results.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
