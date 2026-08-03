import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { Resend } from 'resend';

export function createSendEmailWorker(connection: IORedis) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  return new Worker(
    'send-email',
    async (job) => {
      const { to, from, subject, html } = job.data;
      const { data, error } = await resend.emails.send({
        from: from ?? 'no-reply@resend.dev',
        to,
        subject,
        html,
      });

      if (error) {
        throw new Error(`Resend send failed: ${error.name} - ${error.message}`);
      }
    },
    { connection },
  );
}
