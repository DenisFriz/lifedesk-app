import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import * as brevo from '@getbrevo/brevo';
import type { SendEmailJobData } from '@queues/sendEmailQueue.js';

export async function processSendEmailJob(
  job: { data: SendEmailJobData },
  apiInstance: brevo.TransactionalEmailsApi,
): Promise<void> {
  const { to, from, subject, html, templateId, params } = job.data;

  const recipients = Array.isArray(to) ? to : [to];
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.sender = {
    email: from ?? process.env.BREVO_SENDER_EMAIL ?? 'noreply@lifedesk.app',
  };
  sendSmtpEmail.to = recipients.map((email) => ({ email }));

  if (templateId != null) {
    sendSmtpEmail.templateId = templateId;
    if (params) {
      sendSmtpEmail.params = params;
    }
  } else {
    if (subject) {
      sendSmtpEmail.subject = subject;
    }
    if (html) {
      sendSmtpEmail.htmlContent = html;
    }
  }

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    throw new Error(`Brevo send failed: ${errorMessage}`);
  }
}

export function createSendEmailWorker(connection: IORedis) {
  const apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY ?? '',
  );

  return new Worker(
    'send-email',
    (job) => processSendEmailJob(job, apiInstance),
    { connection },
  );
}
