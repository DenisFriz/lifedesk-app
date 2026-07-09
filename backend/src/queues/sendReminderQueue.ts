import { Queue } from 'bullmq';
import { Redis as IORedis } from 'ioredis';

export type ReminderEntityType = 'goal' | 'task' | 'event';

export interface SendReminderJobData {
  userId: string;
  entityType: ReminderEntityType;
  entityId: string;
  title: string;
  body: string;
  reminderMinutes: number;
  url: string;
}

const connection = new IORedis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
);

export const sendReminderQueue = new Queue<SendReminderJobData>('send-reminder', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

export function reminderJobId(
  entityType: ReminderEntityType,
  entityId: string,
  reminderMinutes: number,
): string {
  return `reminder:${entityType}:${entityId}:${reminderMinutes}`;
}
