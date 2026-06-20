import 'dotenv/config';
import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = new IORedis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
);

const worker = new Worker(
  'send-email',
  async (job) => {
    const { to, from, subject, html } = job.data;
    await resend.emails.send({
      from: from ?? 'onboarding@resend.dev',
      to,
      subject,
      html,
    });
  },
  { connection },
);

worker.on('completed', (job) =>
  console.log(`[worker] job ${job.id} completed`),
);
worker.on('failed', (job, err) =>
  console.error(`[worker] job ${job?.id} failed:`, err),
);
