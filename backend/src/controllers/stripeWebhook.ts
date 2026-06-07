import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { Subscription, User } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const toISO = (ts: unknown): string | null => {
  if (typeof ts === 'number' && !isNaN(ts) && ts > 0) {
    return new Date(ts * 1000).toISOString();
  }
  return null;
};

const updateUserTier = async (
  user_email: string,
  tier: string,
): Promise<void> => {
  await User.findOneAndUpdate(
    { email: user_email },
    { $set: { subscription_tier: tier } },
  );
};

const sendEmail = (to: string, subject: string, body: string): void => {
  console.log(`[EMAIL] To: ${to}\nSubject: ${subject}\n${body}`);
};

const planLabel = (plan: string | null): string =>
  plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : '';

export async function stripeWebhook(req: Request, res: Response) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const signature = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      req.body,
      signature,
      webhookSecret,
    );
  } catch (err: any) {
    return res.status(400).json({
      error: `Webhook signature verification failed: ${err.message}`,
    });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { user_email, plan_name } = (session.metadata || {}) as {
        user_email?: string;
        plan_name?: string;
      };

      if (!user_email || !plan_name) {
        return res.json({ received: true });
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      const periodStart = toISO(stripeSubscription.current_period_start);
      const periodEnd = toISO(stripeSubscription.current_period_end);

      const existing = await Subscription.findOne({
        user_email,
      })
        .lean()
        .select('_id');
      if (existing) {
        await Subscription.findOneAndUpdate(
          { user_email },
          {
            $set: {
              plan_name,
              status: stripeSubscription.status,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: stripeSubscription.id,
              current_period_start: periodStart,
              current_period_end: periodEnd,
              cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            },
          },
        );
      } else {
        const user = await User.findOne({ email: user_email })
          .lean()
          .select('id');
        await Subscription.create({
          user_id: user?.id ?? '',
          user_email,
          plan_name,
          status: stripeSubscription.status,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: stripeSubscription.id,
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        });
      }

      await updateUserTier(user_email, plan_name);

      sendEmail(
        user_email,
        `Welcome to Lifedesk ${planLabel(plan_name)}! 🎉`,
        `<p>Hi there,</p>
        <p>Thank you for upgrading to the <strong>Lifedesk ${planLabel(plan_name)} Plan</strong>!</p>
        <p>You now have access to all the features included in your new plan. Log in to explore your enhanced experience.</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Best regards,<br>The Lifedesk Team</p>`,
      );
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(sub.customer as string);

      if (customer.deleted) {
        return res.json({ received: true });
      }

      const user_email = typeof customer !== 'string' ? customer.email : null;

      if (!user_email) {
        return res.json({ received: true });
      }

      const priceId = sub.items?.data?.[0]?.price?.id;
      const plusPriceId = process.env.STRIPE_PLUS_PRICE_ID;
      const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
      let plan_name: string | null = null;
      if (priceId === plusPriceId) plan_name = 'plus';
      else if (priceId === proPriceId) plan_name = 'pro';

      const periodStart = toISO(sub.current_period_start);
      const periodEnd = toISO(sub.current_period_end);

      const updateData: Record<string, any> = {
        status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end,
      };
      if (periodStart) updateData.current_period_start = periodStart;
      if (periodEnd) updateData.current_period_end = periodEnd;
      if (plan_name) updateData.plan_name = plan_name;

      const existing = await Subscription.findOne({
        user_email,
      })
        .lean()
        .select('plan_name _id');
      const oldPlan = existing?.plan_name ?? null;

      if (existing) {
        await Subscription.findOneAndUpdate(
          { user_email },
          { $set: updateData },
        );
      } else {
        const user = await User.findOne({ email: user_email })
          .lean()
          .select('id');
        await Subscription.create({
          user_id: user?.id ?? '',
          user_email,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          ...updateData,
        });
      }

      if (plan_name) {
        await updateUserTier(user_email, plan_name);

        const planRank: Record<string, number> = {
          free: 0,
          plus: 1,
          pro: 2,
          enterprise: 3,
        };
        const isDowngrade =
          oldPlan !== null && planRank[plan_name] < planRank[oldPlan];
        const isUpgrade =
          oldPlan !== null && planRank[plan_name] > planRank[oldPlan];

        if (isUpgrade) {
          sendEmail(
            user_email,
            `You've upgraded to Lifedesk ${planLabel(plan_name)}! 🎉`,
            `<p>Hi there,</p>
            <p>Great news! Your Lifedesk plan has been upgraded to <strong>${planLabel(plan_name)}</strong>.</p>
            <p>You now have access to all the features of your new plan. Log in to explore!</p>
            <p>Best regards,<br>The Lifedesk Team</p>`,
          );
        }

        if (isDowngrade) {
          sendEmail(
            user_email,
            `Your Lifedesk plan has changed to ${planLabel(plan_name)}`,
            `<p>Hi there,</p>
            <p>Your Lifedesk subscription has been changed from <strong>${planLabel(oldPlan)}</strong> to <strong>${planLabel(plan_name)}</strong>.</p>
            <p>Please note the following:</p>
            <ul>
              <li>Some features that were available on your previous plan are <strong>no longer accessible</strong> on your current plan.</li>
              <li>Any existing entries that exceed the limits of your new plan <strong>will not be accessible</strong> until you upgrade again or remove entries to stay within the limits.</li>
            </ul>
            <p>You can review what's included in each plan on our <a href="https://app.lifedesk.me/Upgrade">Upgrade page</a>.</p>
            <p>If you have any questions or need help, please contact our support team.</p>
            <p>Best regards,<br>The Lifedesk Team</p>`,
          );
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(sub.customer as string);

      if (customer.deleted) {
        return res.json({ received: true });
      }

      const user_email = typeof customer !== 'string' ? customer.email : null;

      if (!user_email) {
        return res.json({ received: true });
      }

      await Subscription.findOneAndUpdate(
        { user_email },
        {
          $set: {
            plan_name: 'free',
            status: 'canceled',
            cancel_at_period_end: false,
          },
        },
      );

      await updateUserTier(user_email, 'free');

      sendEmail(
        user_email,
        `Your Lifedesk subscription has been cancelled`,
        `<p>Hi there,</p>
        <p>Your Lifedesk subscription has been cancelled and your account has been downgraded.</p>
        <p>Please note:</p>
        <ul>
          <li>Premium features are <strong>no longer accessible</strong> on the Free plan.</li>
          <li>Any existing entries that exceed the Free plan limits <strong>will not be accessible</strong> until you upgrade your plan again.</li>
        </ul>
        <p>We'd love to have you back! You can resubscribe anytime on our <a href="https://app.lifedesk.me/Upgrade">Upgrade page</a>.</p>
        <p>Best regards,<br>The Lifedesk Team</p>`,
      );
    }

    res.json({ received: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
