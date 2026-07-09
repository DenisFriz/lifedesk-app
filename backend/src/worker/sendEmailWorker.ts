import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { Resend } from 'resend';

export function createSendEmailWorker(connection: IORedis) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  return new Worker(
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
}
