import Stripe from 'stripe';
import type { Request, Response } from 'express';
import { Subscription, User } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const toISO = (ts: unknown) => {
  if (typeof ts === 'number' && !isNaN(ts) && ts > 0) {
    return new Date(ts * 1000).toISOString();
  }
  return null;
};

function isStripeCustomer(
  customer: Stripe.Customer | Stripe.DeletedCustomer | string,
): customer is Stripe.Customer {
  return typeof customer !== 'string' && !('deleted' in customer);
}

type BackfillSubscriptionsBody = {
  dry_run?: boolean;
};

export async function backfillSubscriptions(
  req: Request<unknown, unknown, BackfillSubscriptionsBody>,
  res: Response,
) {
  try {
    const { dry_run = false } = req.body;

    const plusPriceId = process.env.STRIPE_PLUS_PRICE_ID;
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID;

    const results: any[] = [];
    let cursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const params: Stripe.SubscriptionListParams = {
        status: 'active',
        limit: 100,
        ...(cursor ? { starting_after: cursor } : {}),
      };

      const subscriptions = await stripe.subscriptions.list(params);

      for (const sub of subscriptions.data) {
        const customer = await stripe.customers.retrieve(
          sub.customer as string,
        );

        const user_email = isStripeCustomer(customer) ? customer.email : null;

        if (!user_email) continue;

        const priceId = sub.items?.data?.[0]?.price?.id;

        let plan_name: 'plus' | 'pro' | 'free' = 'free';

        if (priceId === plusPriceId) plan_name = 'plus';
        else if (priceId === proPriceId) plan_name = 'pro';

        const subscriptionData = {
          user_email,
          plan_name,
          status: sub.status,
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          current_period_start: toISO(sub.current_period_start),
          current_period_end: toISO(sub.current_period_end),
          cancel_at_period_end: sub.cancel_at_period_end,
        };

        const existing = await Subscription.findOne({
          stripe_subscription_id: sub.id,
        });

        if (!dry_run) {
          if (existing) {
            await Subscription.updateOne(
              { stripe_subscription_id: sub.id },
              { $set: subscriptionData },
            );

            results.push({
              action: 'updated',
              stripe_subscription_id: sub.id,
            });
          } else {
            const user = await User.findOne({ email: user_email });

            const stripeCustomerId =
              typeof sub.customer === 'string'
                ? sub.customer
                : sub.customer?.id;

            await Subscription.create({
              user_id: user?._id ?? null,
              ...subscriptionData,
              stripe_customer_id: stripeCustomerId,
            });

            results.push({
              action: 'created',
              stripe_subscription_id: sub.id,
            });
          }

          const user = await User.findOne({ email: user_email });

          if (user && user.subscription_tier !== plan_name) {
            await User.updateOne(
              { _id: user._id },
              { $set: { subscription_tier: plan_name } },
            );
          }
        } else {
          results.push({
            action: existing ? 'would_update' : 'would_create',
            stripe_subscription_id: sub.id,
            data: subscriptionData,
          });
        }
      }

      hasMore = subscriptions.has_more;

      if (hasMore && subscriptions.data.length > 0) {
        cursor = subscriptions.data[subscriptions.data.length - 1].id;
      }
    }

    res.json({
      dry_run,
      total_processed: results.length,
      results: results.slice(0, 10),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
