import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { Subscription, User } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const priceIdMap: Record<string, string | undefined> = {
  plus: process.env.STRIPE_PLUS_PRICE_ID,
  pro: process.env.STRIPE_PRO_PRICE_ID,
};

const toISO = (ts: unknown): string | null => {
  if (typeof ts === 'number' && ts > 0) {
    return new Date(ts * 1000).toISOString();
  }
  return null;
};

type CreateCheckoutSessionBody = {
  plan_name: 'plus' | 'pro';
  success_url?: string;
  cancel_url?: string;
};

export async function createCheckoutSession(
  req: Request<{}, {}, CreateCheckoutSessionBody>,
  res: Response,
) {
  try {
    const { plan_name, success_url, cancel_url } = req.body;
    const priceId = priceIdMap[plan_name];

    if (!priceId) {
      return res.status(400).json({
        error: 'Plan not found or no Stripe price configured',
      });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existingSubscription = await Subscription.findOne({
      user_email: req.user.email,
    }).lean();

    let stripeSubscriptionId =
      existingSubscription?.stripe_subscription_id || null;
    let stripeCustomerId = existingSubscription?.stripe_customer_id || null;

    if (!stripeSubscriptionId) {
      try {
        const customers = await stripe.customers.list({
          email: req.user.email,
          limit: 1,
        });
        const stripeCustomer = customers.data[0];

        if (stripeCustomer) {
          stripeCustomerId = stripeCustomer.id;
          const activeSubs = await stripe.subscriptions.list({
            customer: stripeCustomer.id,
            status: 'active',
            limit: 1,
          });

          if (activeSubs.data.length > 0) {
            stripeSubscriptionId = activeSubs.data[0].id;
            const priceOnSub = activeSubs.data[0].items?.data?.[0]?.price?.id;
            const plusPriceId = priceIdMap.plus;
            const proPriceId = priceIdMap.pro;
            let currentPlanName = 'plus';
            if (priceOnSub === proPriceId) currentPlanName = 'pro';

            const sub = activeSubs.data[0];

            if (existingSubscription) {
              await Subscription.findOneAndUpdate(
                { id: existingSubscription.id },
                {
                  $set: {
                    stripe_customer_id: stripeCustomerId,
                    stripe_subscription_id: stripeSubscriptionId,
                    plan_name: currentPlanName,
                    status: sub.status,
                    current_period_start: toISO(sub.current_period_start),
                    current_period_end: toISO(sub.current_period_end),
                    cancel_at_period_end: sub.cancel_at_period_end,
                  },
                },
              );
            } else {
              const user = await User.findOne({
                email: req.user.email,
              }).lean();
              await Subscription.create({
                user_id: user?.id || req.user.id,
                user_email: req.user.email,
                stripe_customer_id: stripeCustomerId,
                stripe_subscription_id: stripeSubscriptionId,
                plan_name: currentPlanName,
                status: sub.status,
                current_period_start: toISO(sub.current_period_start),
                current_period_end: toISO(sub.current_period_end),
                cancel_at_period_end: sub.cancel_at_period_end,
              });
            }
          }
        }
      } catch (err: any) {
        console.error('Stripe lookup failed:', err.message);
      }
    }

    if (stripeSubscriptionId) {
      try {
        const stripeSubscription =
          await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const subscriptionItemId = stripeSubscription.items.data[0]?.id;

        if (subscriptionItemId) {
          await stripe.subscriptions.update(stripeSubscriptionId, {
            items: [{ id: subscriptionItemId, price: priceId }],
            proration_behavior: 'always_invoice',
            billing_cycle_anchor: 'unchanged',
            metadata: {
              user_email: req.user.email,
              user_id: req.user.id,
              plan_name,
            },
          });

          await User.findOneAndUpdate(
            { id: req.user.id },
            { $set: { subscription_tier: plan_name } },
          );

          const redirectUrl =
            success_url ||
            `${process.env.FRONTEND_URL}/Profile?checkout=success`;
          return res.json({ url: redirectUrl });
        }
      } catch (err: any) {
        console.error('Stripe update failed:', err.message);
      }
    }

    const sessionParams: any = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url:
        success_url || `${process.env.FRONTEND_URL}/Profile?checkout=success`,
      cancel_url:
        cancel_url || `${process.env.FRONTEND_URL}/Profile?checkout=cancel`,
      customer_email: stripeCustomerId ? undefined : req.user.email,
      customer: stripeCustomerId || undefined,
      metadata: {
        user_email: req.user.email,
        user_id: req.user.id,
        plan_name,
      },
    };

    const session = await stripe.checkout.sessions.create({
      ...sessionParams,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
