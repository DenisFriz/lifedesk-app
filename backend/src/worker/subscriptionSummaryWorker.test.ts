import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/models/index.js', () => ({
  User: { countDocuments: vi.fn() },
}));

vi.mock('@/queues/sendEmailQueue.js', () => ({
  sendEmailQueue: { add: vi.fn() },
}));

import { User } from '@/models/index.js';
import { sendEmailQueue } from '@/queues/sendEmailQueue.js';
import { handleSubscriptionSummary } from './subscriptionSummaryWorker.js';

describe('subscriptionSummaryWorker', () => {
  const originalAdminEmail = process.env.ADMIN_REPORT_EMAIL;
  const originalTemplateId = process.env.BREVO_WEEKLY_SUBSCRIPTION_REPORT;
  const mockJob = { data: {} } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_REPORT_EMAIL = 'admin@example.com';
    process.env.BREVO_WEEKLY_SUBSCRIPTION_REPORT = '123';
  });

  afterEach(() => {
    process.env.ADMIN_REPORT_EMAIL = originalAdminEmail;
    process.env.BREVO_WEEKLY_SUBSCRIPTION_REPORT = originalTemplateId;
  });

  describe('Scenario 1: counts users per tier and emails the admin', () => {
    it('should query countDocuments for free/plus/pro and send correct params', async () => {
      vi.mocked(User.countDocuments)
        .mockResolvedValueOnce(123) // free
        .mockResolvedValueOnce(12) // plus
        .mockResolvedValueOnce(11); // pro

      await handleSubscriptionSummary(mockJob);

      expect(User.countDocuments).toHaveBeenCalledWith({ subscription_tier: 'free' });
      expect(User.countDocuments).toHaveBeenCalledWith({ subscription_tier: 'plus' });
      expect(User.countDocuments).toHaveBeenCalledWith({ subscription_tier: 'pro' });

      expect(sendEmailQueue.add).toHaveBeenCalledOnce();
      const [_jobName, jobData] = vi.mocked(sendEmailQueue.add).mock.calls[0];
      expect(jobData.to).toBe('admin@example.com');
      expect(jobData.templateId).toBe(123);
      expect(jobData.params).toEqual({
        free_count: '123',
        plus_count: '12',
        pro_count: '11',
        total_count: '146',
        report_date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      });
    });
  });

  describe('Scenario 2: all tiers empty', () => {
    it('should still send with zero counts', async () => {
      vi.mocked(User.countDocuments).mockResolvedValue(0);

      await handleSubscriptionSummary(mockJob);

      const [_jobName, jobData] = vi.mocked(sendEmailQueue.add).mock.calls[0];
      expect(jobData.params).toMatchObject({
        free_count: '0',
        plus_count: '0',
        pro_count: '0',
        total_count: '0',
      });
    });
  });

  describe('Scenario 3: ADMIN_REPORT_EMAIL not configured', () => {
    it('should skip sending and not throw', async () => {
      delete process.env.ADMIN_REPORT_EMAIL;
      vi.mocked(User.countDocuments).mockResolvedValue(5);

      await expect(handleSubscriptionSummary(mockJob)).resolves.toBeUndefined();
      expect(sendEmailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 4: BREVO_WEEKLY_SUBSCRIPTION_REPORT not configured', () => {
    it('should throw before enqueueing', async () => {
      delete process.env.BREVO_WEEKLY_SUBSCRIPTION_REPORT;
      vi.mocked(User.countDocuments).mockResolvedValue(5);

      await expect(handleSubscriptionSummary(mockJob)).rejects.toThrow(
        'BREVO_WEEKLY_SUBSCRIPTION_REPORT is not configured',
      );
      expect(sendEmailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 5: enqueue failure is handled by existing retry mechanism', () => {
    it('should propagate error so BullMQ retries the job', async () => {
      vi.mocked(User.countDocuments).mockResolvedValue(1);
      vi.mocked(sendEmailQueue.add).mockRejectedValueOnce(
        new Error('Redis unreachable'),
      );

      await expect(handleSubscriptionSummary(mockJob)).rejects.toThrow(
        'Redis unreachable',
      );
    });
  });
});
