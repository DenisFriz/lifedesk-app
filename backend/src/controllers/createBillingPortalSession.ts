import Stripe from 'stripe';
import type { Request, Response } from 'express';
import { Subscription } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type CreateBillingPortalSessionBody = {
  return_url?: string;
};

export async function createBillingPortalSession(
  req: Request<unknown, unknown, CreateBillingPortalSessionBody>,
  res: Response,
) {
  try {
    const { return_url } = req.body;

    if (return_url && typeof return_url !== 'string') {
      return res.status(400).json({ error: 'Invalid return_url' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscription = await Subscription.findOne({
      user_email: req.user.email,
    })
      .lean()
      .select('stripe_customer_id');

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      try {
        const customers = await stripe.customers.list({
          email: req.user.email,
          limit: 1,
        });

        customerId = customers.data?.[0]?.id;
      } catch (err: any) {
        console.error('Stripe lookup failed:', err.message);
      }
    }

    if (!customerId) {
      return res.status(404).json({
        error: 'No Stripe customer found for this account.',
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || `${process.env.FRONTEND_URL}/Profile`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
