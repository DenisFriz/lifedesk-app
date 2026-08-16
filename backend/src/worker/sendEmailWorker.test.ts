import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SendEmailJobData } from '@queues/sendEmailQueue.js';
import { processSendEmailJob } from './sendEmailWorker.js';

describe('sendEmailWorker', () => {
  let mockApiInstance: any;

  beforeEach(() => {
    mockApiInstance = {
      sendTransacEmail: vi.fn(),
    };
  });

  describe('Scenario 6: email send failure is handled by existing retry mechanism', () => {
    it('should throw on Brevo API failure, triggering BullMQ retry', async () => {
      const mockJob: any = {
        data: {
          to: 'user@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockRejectedValueOnce(
        new Error('Brevo API error'),
      );

      await expect(
        processSendEmailJob(mockJob, mockApiInstance),
      ).rejects.toThrow('Brevo send failed: Brevo API error');
    });

    it('should wrap error message correctly', async () => {
      const mockJob: any = {
        data: {
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockRejectedValueOnce(
        new Error('Network timeout'),
      );

      await expect(
        processSendEmailJob(mockJob, mockApiInstance),
      ).rejects.toThrow('Brevo send failed: Network timeout');
    });

    it('should handle non-Error rejections', async () => {
      const mockJob: any = {
        data: {
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockRejectedValueOnce(
        'Some string error',
      );

      await expect(
        processSendEmailJob(mockJob, mockApiInstance),
      ).rejects.toThrow('Brevo send failed: Some string error');
    });

    it('should successfully send email when Brevo API succeeds', async () => {
      const mockJob: any = {
        data: {
          to: 'user@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockResolvedValueOnce(undefined);

      await expect(
        processSendEmailJob(mockJob, mockApiInstance),
      ).resolves.toBeUndefined();

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledOnce();
    });

    it('should handle multiple recipients', async () => {
      const mockJob: any = {
        data: {
          to: ['user1@example.com', 'user2@example.com'],
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockResolvedValueOnce(undefined);

      await processSendEmailJob(mockJob, mockApiInstance);

      expect(mockApiInstance.sendTransacEmail).toHaveBeenCalledOnce();
      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0]?.[0];
      expect(callArgs?.to).toHaveLength(2);
      expect(callArgs?.to[0].email).toBe('user1@example.com');
      expect(callArgs?.to[1].email).toBe('user2@example.com');
    });

    it('should use custom from address when provided', async () => {
      const mockJob: any = {
        data: {
          to: 'user@example.com',
          from: 'sender@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockResolvedValueOnce(undefined);

      await processSendEmailJob(mockJob, mockApiInstance);

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0]?.[0];
      expect(callArgs?.sender.email).toBe('sender@example.com');
    });

    it('should use default from address when not provided', async () => {
      const mockJob: any = {
        data: {
          to: 'user@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockResolvedValueOnce(undefined);

      await processSendEmailJob(mockJob, mockApiInstance);

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0]?.[0];
      expect(callArgs?.sender.email).toBe(
        process.env.BREVO_SENDER_EMAIL ?? 'noreply@lifedesk.app',
      );
    });

    it('should send with Brevo templateId and params when provided', async () => {
      const mockJob: any = {
        data: {
          to: 'user@example.com',
          templateId: 42,
          params: {
            first_name: 'Denis',
            email_verification_link:
              'https://example.com/verify-email?token=abc',
          },
        } as SendEmailJobData,
      };

      mockApiInstance.sendTransacEmail.mockResolvedValueOnce(undefined);

      await processSendEmailJob(mockJob, mockApiInstance);

      const callArgs = mockApiInstance.sendTransacEmail.mock.calls[0]?.[0];
      expect(callArgs?.templateId).toBe(42);
      expect(callArgs?.params).toEqual({
        first_name: 'Denis',
        email_verification_link: 'https://example.com/verify-email?token=abc',
      });
      expect(callArgs?.htmlContent).toBeUndefined();
    });
  });
});
