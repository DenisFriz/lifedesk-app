import type { Request, Response } from 'express';
import { User } from '@/models/index.js';
import { sanitizeUser } from '@/utils/sanitizeUser.js';

type SubscriptionTier = 'free' | 'plus' | 'pro';

type AdminSetUserTierBody = {
  user_email: string;
  subscription_tier: SubscriptionTier;
  terms_accepted_at?: string;
};

export async function adminSetUserTier(
  req: Request<unknown, unknown, AdminSetUserTierBody>,
  res: Response,
) {
  try {
    const { user_email, subscription_tier, terms_accepted_at } = req.body;

    if (!user_email || !subscription_tier) {
      return res.status(400).json({
        error: 'user_email and subscription_tier required',
      });
    }

    const user = await User.findOne({ email: user_email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.subscription_tier = subscription_tier;

    if (terms_accepted_at) {
      user.terms_accepted_at = terms_accepted_at;
    }

    await user.save();

    const result = sanitizeUser(user);

    return res.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
