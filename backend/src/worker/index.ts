import 'dotenv/config';
import express from 'express';
import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { Resend } from 'resend';

const app = express();
const PORT = 8000;

app.get('/', (_req, res) => {
  res.send('Worker is running 🚀');
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[express] server listening on port ${PORT}`);
});

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
