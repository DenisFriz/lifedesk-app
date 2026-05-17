import type { Request, Response } from 'express';
import { Subscription } from '@/models/index.js';

const knownSubIds: string[] = [
  // Stripe subscription IDs
];

export async function cleanupSubscriptions(req: Request, res: Response) {
  try {
    const allSubs = await Subscription.find({
      stripe_subscription_id: { $in: knownSubIds },
    }).lean();

    const byStripeId: Record<string, any[]> = {};

    allSubs.forEach((sub) => {
      const key = sub.stripe_subscription_id;

      if (!key) return;

      if (!byStripeId[key]) {
        byStripeId[key] = [];
      }

      byStripeId[key].push(sub);
    });

    let deleted = 0;

    for (const [, subs] of Object.entries(byStripeId)) {
      if (subs.length > 1) {
        const sorted = subs.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );

        const idsToDelete = sorted.slice(1).map((s) => s._id);

        if (idsToDelete.length > 0) {
          await Subscription.deleteMany({
            _id: { $in: idsToDelete },
          });

          deleted += idsToDelete.length;
        }
      }
    }

    res.json({
      success: true,
      deleted_count: deleted,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
