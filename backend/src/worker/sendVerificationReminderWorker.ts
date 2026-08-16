import { Worker } from 'bullmq';
import { Redis as IORedis } from 'ioredis';
import { User } from '@models/index.js';
import type { VerificationReminderJobData } from '@queues/verificationReminderQueue.js';
import {
  createEmailVerificationToken,
  getEmailVerificationExpires,
  enqueueEmailVerificationReminderEmail,
} from '@/utils/emailVerification.js';

export async function processVerificationReminderJob(job: {
  data: VerificationReminderJobData;
}): Promise<void> {
  const { userId } = job.data;

  // Atomic claim: flips verification_reminder_sent_at from null -> Date in one
  // round trip. This ensures that even if the job is retried (BullMQ retries
  // reuse the same job/data), a prior run's claim prevents a re-send, achieving
  // at-most-once semantics.
  //
  // Trade-off: if sendEmailQueue.add() throws after this update succeeds,
  // the retry will see verification_reminder_sent_at already set and silently
  // skip (not re-enqueue the email). This is an acceptable at-most-once
  // guarantee given the hard requirement is "no duplicates."
  const token = createEmailVerificationToken();

  const claimed = await User.findOneAndUpdate(
    {
      _id: userId,
      email_verified: false,
      is_deleted: false,
      verification_reminder_sent_at: null,
    },
    {
      $set: {
        verification_reminder_sent_at: new Date(),
        emailVerificationCode: token,
        emailVerificationExpires: getEmailVerificationExpires(),
      },
    },
    { new: true },
  );

  if (!claimed) {
    // User was already verified, reminder already sent, account deleted,
    // or user doesn't exist — nothing to do.
    return;
  }

  await enqueueEmailVerificationReminderEmail(
    claimed.email,
    claimed.full_name || 'there',
    token,
  );
}

export function createSendVerificationReminderWorker(connection: IORedis) {
  return new Worker(
    'verification-reminder',
    processVerificationReminderJob,
    { connection },
  );
}
