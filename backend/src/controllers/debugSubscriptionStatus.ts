import type { Request, Response } from 'express';
import { Subscription } from '@/models/index.js';

export async function debugSubscriptionStatus(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const sub = await Subscription.findOne({ user_email: user.email }).lean();

    res.json({
      user: {
        id: user._id,
        email: user.email,
        subscription_tier: user.subscription_tier,
      },
      subscription: sub || null,
      message: sub ? 'Subscription found' : 'No subscription record',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
