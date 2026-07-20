import { Queue } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

export interface SendEmailJobData {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
}

const connection = new IORedis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
);

export const sendEmailQueue = new Queue<SendEmailJobData>('send-email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});
