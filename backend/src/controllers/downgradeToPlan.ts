import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { Subscription, User } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type DowngradeToPlanBody = {
  plan_name: 'plus';
};

export async function downgradeToPlan(
  req: Request<unknown, unknown, DowngradeToPlanBody>,
  res: Response,
) {
  try {
    const { plan_name } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (plan_name !== 'plus') {
      return res
        .status(400)
        .json({ error: 'Only downgrade to plus is supported' });
    }

    const sub = await Subscription.findOne({
      user_email: req.user.email,
    })
      .lean()
      .select('stripe_subscription_id');
    if (!sub) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    if (!sub.stripe_subscription_id) {
      return res.status(400).json({ error: 'No Stripe subscription ID' });
    }

    const plusPriceId = process.env.STRIPE_PLUS_PRICE_ID!;
    const stripeSubscription = await stripe.subscriptions.retrieve(
      sub.stripe_subscription_id,
    );
    const subscriptionItemId = stripeSubscription.items.data[0]?.id;

    if (subscriptionItemId) {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: subscriptionItemId, price: plusPriceId }],
        proration_behavior: 'none',
      });

      await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: { subscription_tier: plan_name } },
      );

      return res.json({
        success: true,
        message: 'Downgraded to plus plan',
      });
    }

    res.status(400).json({ error: 'Failed to downgrade' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
