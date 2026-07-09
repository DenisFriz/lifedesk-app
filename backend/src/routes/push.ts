import { Router, type Request, type Response } from 'express';
import { PushSubscription } from '@/models/PushSubscription.js';

const router = Router();

router.get('/vapid-public-key', (req: Request, res: Response) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

router.post('/subscribe', async (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        $set: {
          user_id: req.user._id,
          keys,
          user_agent: req.headers['user-agent'] ?? null,
        },
      },
      { upsert: true, new: true },
    );

    res.status(201).json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.post('/unsubscribe', async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint' });
    }

    await PushSubscription.deleteOne({ endpoint, user_id: req.user._id });

    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
