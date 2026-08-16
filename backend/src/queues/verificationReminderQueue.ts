import { Queue } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

export interface VerificationReminderJobData {
  userId: string;
}

const connection = new IORedis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
);

export const verificationReminderQueue = new Queue<VerificationReminderJobData>(
  'verification-reminder',
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

export function verificationReminderJobId(userId: string): string {
  return `verification-reminder:${userId}`;
}
