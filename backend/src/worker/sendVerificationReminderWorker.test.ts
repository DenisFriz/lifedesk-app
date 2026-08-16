import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { VerificationReminderJobData } from '@queues/verificationReminderQueue.js';
import { processVerificationReminderJob } from './sendVerificationReminderWorker.js';

vi.mock('@models/index.js', () => ({
  User: {
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock('@queues/sendEmailQueue.js', () => ({
  sendEmailQueue: {
    add: vi.fn(),
  },
}));

import { User } from '@models/index.js';
import { sendEmailQueue } from '@queues/sendEmailQueue.js';

describe('sendVerificationReminderWorker', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockJob = {
    data: { userId: mockUserId } as VerificationReminderJobData,
  };

  const originalFrontendUrl = process.env.FRONTEND_URL;
  const originalTemplateId =
    process.env.BREVO_EMAIL_VERIFICATION_REMINDER_TEMPLATE_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.FRONTEND_URL = 'https://example.com';
    process.env.BREVO_EMAIL_VERIFICATION_REMINDER_TEMPLATE_ID = '99';
  });

  afterEach(() => {
    process.env.FRONTEND_URL = originalFrontendUrl;
    process.env.BREVO_EMAIL_VERIFICATION_REMINDER_TEMPLATE_ID =
      originalTemplateId;
  });

  describe('Scenario 1: user verifies email before job runs', () => {
    it('should not send email if user already verified', async () => {
      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(null);

      await processVerificationReminderJob(mockJob);

      expect(sendEmailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 2: user remains unverified after 24 hours', () => {
    it('should send Brevo reminder email when user still unverified', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@example.com',
        full_name: 'John Doe',
        email_verified: false,
        verification_reminder_sent_at: new Date(),
      };

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(mockUser);

      await processVerificationReminderJob(mockJob);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: mockUserId,
          email_verified: false,
          is_deleted: false,
          verification_reminder_sent_at: null,
        },
        {
          $set: {
            verification_reminder_sent_at: expect.any(Date),
            emailVerificationCode: expect.any(String),
            emailVerificationExpires: expect.any(Date),
          },
        },
        { new: true },
      );

      expect(sendEmailQueue.add).toHaveBeenCalledOnce();
      const [_jobName, jobData] = vi.mocked(sendEmailQueue.add).mock.calls[0];
      expect(jobData.to).toBe('user@example.com');
      expect(jobData.templateId).toBe(99);
      expect(jobData.params?.first_name).toBe('John Doe');
      expect(jobData.params?.verification_url).toMatch(
        /^https:\/\/example\.com\/verify-email\?token=.+/,
      );
    });

    it('should include user name in the email params', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@example.com',
        full_name: 'Jane Smith',
        email_verified: false,
        verification_reminder_sent_at: new Date(),
      };

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(mockUser);

      await processVerificationReminderJob(mockJob);

      const [_jobName, jobData] = vi.mocked(sendEmailQueue.add).mock.calls[0];
      expect(jobData.params?.first_name).toBe('Jane Smith');
    });

    it('should use email local-part when full_name is null', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@example.com',
        full_name: null,
        email_verified: false,
        verification_reminder_sent_at: new Date(),
      };

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(mockUser);

      await processVerificationReminderJob(mockJob);

      const [_jobName, jobData] = vi.mocked(sendEmailQueue.add).mock.calls[0];
      expect(jobData.params?.first_name).toBe('user');
    });
  });

  describe('Scenario 3: reminder is sent only once (idempotency)', () => {
    it('should not send email on second execution', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@example.com',
        full_name: 'John Doe',
        email_verified: false,
        verification_reminder_sent_at: new Date(),
      };

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(mockUser);
      await processVerificationReminderJob(mockJob);

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(null);
      await processVerificationReminderJob(mockJob);

      expect(sendEmailQueue.add).toHaveBeenCalledOnce();
    });
  });

  describe('Scenario 4: retry after simulated send failure does not duplicate', () => {
    it('should not re-send if earlier attempt already set reminder_sent_at', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@example.com',
        full_name: 'John Doe',
        email_verified: false,
        verification_reminder_sent_at: new Date(),
      };

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(mockUser);
      vi.mocked(sendEmailQueue.add).mockRejectedValueOnce(
        new Error('Redis unreachable'),
      );

      await expect(processVerificationReminderJob(mockJob)).rejects.toThrow(
        'Redis unreachable',
      );

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(null);
      await processVerificationReminderJob(mockJob);

      expect(sendEmailQueue.add).toHaveBeenCalledOnce();
    });
  });

  describe('Scenario 5: deleted or missing account', () => {
    it('should silently skip if user is deleted', async () => {
      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(null);

      await processVerificationReminderJob(mockJob);

      expect(sendEmailQueue.add).not.toHaveBeenCalled();
    });

    it('should silently skip if user does not exist', async () => {
      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(null);

      await expect(processVerificationReminderJob(mockJob)).resolves.toBeUndefined();
      expect(sendEmailQueue.add).not.toHaveBeenCalled();
    });

    it('should check is_deleted flag in the filter', async () => {
      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(null);

      await processVerificationReminderJob(mockJob);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_deleted: false,
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });
  });

  describe('Scenario 6: email send failure is handled by existing retry mechanism', () => {
    it('should verify email send failure throws (triggers BullMQ retry)', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@example.com',
        full_name: 'John Doe',
        email_verified: false,
        verification_reminder_sent_at: new Date(),
      };

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(mockUser);
      vi.mocked(sendEmailQueue.add).mockRejectedValueOnce(
        new Error('Brevo API failed'),
      );

      await expect(processVerificationReminderJob(mockJob)).rejects.toThrow(
        'Brevo API failed',
      );
    });
  });

  describe('Brevo template params', () => {
    it('should pass verification_url with fresh token', async () => {
      const mockUser = {
        _id: mockUserId,
        email: 'user@example.com',
        full_name: 'Test User',
        email_verified: false,
        verification_reminder_sent_at: new Date(),
      };

      vi.mocked(User.findOneAndUpdate).mockResolvedValueOnce(mockUser);

      await processVerificationReminderJob(mockJob);

      const [_jobName, jobData] = vi.mocked(sendEmailQueue.add).mock.calls[0];
      expect(jobData.templateId).toBe(99);
      expect(jobData.params?.verification_url).toMatch(
        /^https:\/\/example\.com\/verify-email\?token=.+/,
      );
      expect(jobData.html).toBeUndefined();
    });
  });
});
