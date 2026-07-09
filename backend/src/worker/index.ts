import 'dotenv/config';
import express from 'express';
import { Redis as IORedis } from 'ioredis';
import { connectDB } from '@/db/connection.js';
import { createSendEmailWorker } from './sendEmailWorker.js';
import { createSendReminderWorker } from './sendReminderWorker.js';

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

const connection = new IORedis(
  process.env.REDIS_URL ?? 'redis://localhost:6379',
  {
    maxRetriesPerRequest: null,
  },
);

async function startWorkers() {
  try {
    await connectDB();
  } catch (err) {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }

  const emailWorker = createSendEmailWorker(connection);
  const reminderWorker = createSendReminderWorker(connection);

  emailWorker.on('completed', (job) =>
    console.log(`[worker] send-email job ${job.id} completed`),
  );
  emailWorker.on('failed', (job, err) =>
    console.error(`[worker] send-email job ${job?.id} failed:`, err),
  );

  reminderWorker.on('completed', (job) =>
    console.log(`[worker] send-reminder job ${job.id} completed`),
  );
  reminderWorker.on('failed', (job, err) =>
    console.error(`[worker] send-reminder job ${job?.id} failed:`, err),
  );
}

startWorkers().catch((err) => {
  console.error('Failed to start workers:', err);
  process.exit(1);
});
