import webpush from 'web-push';
import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { PushSubscription } from '@/models/PushSubscription.js';

export function createSendReminderWorker(connection: IORedis) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  return new Worker(
    'send-reminder',
    async (job) => {
      const { userId, title, body, url, entityType, entityId } = job.data;

      const subs = await PushSubscription.find({ user_id: userId }).lean();

      if (subs.length === 0) {
        return;
      }

      await Promise.all(
        subs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: sub.keys },
              JSON.stringify({ title, body, url, entityType, entityId }),
            );
          } catch (err: any) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await PushSubscription.deleteOne({ _id: sub._id });
            } else {
              console.error(
                '🔔 Push send failed:',
                err.statusCode,
                err.message,
              );
              throw err;
            }
          }
        }),
      );
    },
    { connection },
  );
}
