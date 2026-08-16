import crypto from 'crypto';
import { sendEmailQueue } from '@queues/sendEmailQueue.js';

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

export function createEmailVerificationToken(): string {
  return crypto.randomUUID();
}

export function getEmailVerificationExpires(): Date {
  return new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
}

export function getEmailVerificationTemplateId(): number {
  const id = Number(process.env.BREVO_EMAIL_VERIFICATION_TEMPLATE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('BREVO_EMAIL_VERIFICATION_TEMPLATE_ID is not configured');
  }
  return id;
}

function resolveFirstName(to: string, name?: string | null): string {
  const trimmed = name?.trim();
  if (trimmed && trimmed.toLowerCase() !== 'there') {
    return trimmed;
  }

  const localPart = to.split('@')[0]?.trim();
  return localPart || 'there';
}

export function getRegistrationCompletedTemplateId(): number {
  const id = Number(process.env.BREVO_REGISTRATION_COMPLETED_TEMPLATE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(
      'BREVO_REGISTRATION_COMPLETED_TEMPLATE_ID is not configured',
    );
  }
  return id;
}

export async function enqueueEmailVerificationEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmailQueue.add('send-email', {
    to,
    templateId: getEmailVerificationTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
      email_verification_link: verifyLink,
    },
  });
}

export async function enqueueRegistrationCompletedEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmailQueue.add('send-email', {
    to,
    templateId: getRegistrationCompletedTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
      frontend_url: `${process.env.FRONTEND_URL}/home`,
    },
  });
}

export function getAccountDeletedTemplateId(): number {
  const id = Number(process.env.BREVO_ACCOUNT_DELETED_TEMPLATE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('BREVO_ACCOUNT_DELETED_TEMPLATE_ID is not configured');
  }
  return id;
}

export async function enqueueAccountDeletedEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmailQueue.add('send-email', {
    to,
    templateId: getAccountDeletedTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
    },
  });
}

export function getEmailChangeConfirmationTemplateId(): number {
  const id = Number(
    process.env.BREVO_EMAIL_ADDRESS_CHANGE_CONFIRMATION_TEMPLATE_ID,
  );
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(
      'BREVO_EMAIL_ADDRESS_CHANGE_CONFIRMATION_TEMPLATE_ID is not configured',
    );
  }
  return id;
}

export async function enqueueEmailChangeConfirmationEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const confirmLink = `${process.env.FRONTEND_URL}/confirm-email-change?token=${token}`;

  await sendEmailQueue.add('send-email', {
    to,
    templateId: getEmailChangeConfirmationTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
      confirm_new_email_link: confirmLink,
      expiration_time: '24 hours',
    },
  });
}

export function getEmailVerificationReminderTemplateId(): number {
  const id = Number(process.env.BREVO_EMAIL_VERIFICATION_REMINDER_TEMPLATE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(
      'BREVO_EMAIL_VERIFICATION_REMINDER_TEMPLATE_ID is not configured',
    );
  }
  return id;
}

export async function enqueueEmailVerificationReminderEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmailQueue.add('send-email', {
    to,
    templateId: getEmailVerificationReminderTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
      verification_url: verificationUrl,
    },
  });
}

export function getPasswordResetRequestTemplateId(): number {
  const id = Number(process.env.BREVO_PASSWORD_RESET_REQUEST_TEMPLATE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(
      'BREVO_PASSWORD_RESET_REQUEST_TEMPLATE_ID is not configured',
    );
  }
  return id;
}

export async function enqueuePasswordResetRequestEmail(
  to: string,
  name: string,
  token: string,
): Promise<void> {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmailQueue.add('send-email', {
    to,
    templateId: getPasswordResetRequestTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
      expiration_time: '30 minutes',
      reset_password_link: resetLink,
    },
  });
}

export function getPasswordChangedTemplateId(): number {
  const id = Number(process.env.BREVO_PASSWORD_CHANGED_TEMPLATE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('BREVO_PASSWORD_CHANGED_TEMPLATE_ID is not configured');
  }
  return id;
}

export async function enqueuePasswordChangedEmail(
  to: string,
  name: string,
): Promise<void> {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(now);
  const time =
    new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(now) + ' UTC';

  await sendEmailQueue.add('send-email', {
    to,
    templateId: getPasswordChangedTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
      date,
      time,
      login_link: `${process.env.FRONTEND_URL}/login`,
    },
  });
}

export function getEmailChangeNoticeToOldAddressTemplateId(): number {
  const id = Number(process.env.BREVO_MAIL_TO_OLD_MAIL_ADDRESS_TEMPLATE_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error(
      'BREVO_MAIL_TO_OLD_MAIL_ADDRESS_TEMPLATE_ID is not configured',
    );
  }
  return id;
}

export async function enqueueEmailChangeNoticeToOldAddressEmail(
  to: string,
  name: string,
): Promise<void> {
  await sendEmailQueue.add('send-email', {
    to,
    templateId: getEmailChangeNoticeToOldAddressTemplateId(),
    params: {
      first_name: resolveFirstName(to, name),
      login_link: `${process.env.FRONTEND_URL}/login`,
    },
  });
}
