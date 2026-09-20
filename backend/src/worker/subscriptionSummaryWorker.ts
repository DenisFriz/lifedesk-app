import { Worker, type Job } from 'bullmq';
import type { Redis as IORedis } from 'ioredis';
import { User } from '@/models/index.js';
import { sendEmailQueue } from '@/queues/sendEmailQueue.js';
import type { SubscriptionSummaryJobData } from '@/queues/subscriptionSummaryQueue.js';

function getSubscriptionSummaryTemplateId(): number {
  const id = Number(process.env.BREVO_WEEKLY_SUBSCRIPTION_REPORT);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('BREVO_WEEKLY_SUBSCRIPTION_REPORT is not configured');
  }
  return id;
}

export async function handleSubscriptionSummary(_job: Job<SubscriptionSummaryJobData>) {
  const [free, plus, pro] = await Promise.all([
    User.countDocuments({ subscription_tier: 'free' }),
    User.countDocuments({ subscription_tier: 'plus' }),
    User.countDocuments({ subscription_tier: 'pro' }),
  ]);

  const adminEmail = process.env.ADMIN_REPORT_EMAIL;
  if (!adminEmail) {
    console.error('📊 ADMIN_REPORT_EMAIL not set, skipping subscription summary email');
    return;
  }

  await sendEmailQueue.add('send-email', {
    to: adminEmail,
    templateId: getSubscriptionSummaryTemplateId(),
    params: {
      free_count: String(free),
      plus_count: String(plus),
      pro_count: String(pro),
      total_count: String(free + plus + pro),
      report_date: new Date().toISOString().split('T')[0],
    },
  });
}

export function createSubscriptionSummaryWorker(connection: IORedis) {
  return new Worker<SubscriptionSummaryJobData>(
    'subscription-summary',
    handleSubscriptionSummary,
    { connection },
  );
}
