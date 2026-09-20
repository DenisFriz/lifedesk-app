import { Queue } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

export type SubscriptionSummaryJobData = Record<string, never>;

const connection = new IORedis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
);

export const subscriptionSummaryQueue = new Queue<SubscriptionSummaryJobData>(
  'subscription-summary',
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  },
);

const SCHEDULER_ID = 'subscription-summary-weekly';

export async function scheduleSubscriptionSummaryJob(): Promise<void> {
  await subscriptionSummaryQueue.upsertJobScheduler(
    SCHEDULER_ID,
    {
      pattern: process.env.SUBSCRIPTION_SUMMARY_CRON ?? '0 8 * * 1',
      tz: process.env.SUBSCRIPTION_SUMMARY_TZ ?? 'Europe/Moscow',
    },
    { name: 'subscription-summary', data: {} },
  );
}
