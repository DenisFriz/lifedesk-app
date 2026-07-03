import type { Request, Response } from 'express';
import { User, Subscription } from '@/models/index.js';
import { sendEmailQueue } from '@/queues/sendEmailQueue.js';

export async function weeklyRevenueReport(req: Request, res: Response) {
  try {
    const users = await User.find({})
      .lean()
      .select('email role createdAt subscription_tier');
    const subscriptions = await Subscription.find({})
      .lean()
      .select('status plan_name');

    const adminEmail = 'info@agentur-braun.de';
    const testUser = 'a.braun@agentur-braun.de';

    const filteredUsers = users.filter(
      (u) =>
        u.email !== adminEmail && u.email !== testUser && u.role !== 'admin',
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = filteredUsers.filter(
      (u) => u.createdAt && u.createdAt >= sevenDaysAgo,
    );

    let monthlyRevenue = 0;
    const activeSubs = subscriptions.filter((s) => s.status === 'active');
    activeSubs.forEach((sub) => {
      const price =
        sub.plan_name === 'pro' ? 9.99 : sub.plan_name === 'plus' ? 4.99 : 0;
      monthlyRevenue += price;
    });

    const reportBody = `
      <h2>Weekly Revenue Report</h2>
      <p><strong>Report Date:</strong> ${new Date().toISOString().split('T')[0]}</p>
      <ul>
        <li><strong>Total Users:</strong> ${filteredUsers.length}</li>
        <li><strong>New Users (Last 7 Days):</strong> ${newUsers.length}</li>
        <li><strong>Active Subscriptions:</strong> ${activeSubs.length}</li>
        <li><strong>Monthly Revenue (Estimate):</strong> €${monthlyRevenue.toFixed(2)}</li>
      </ul>
    `;

    await sendEmailQueue.add('send-email', {
      to: adminEmail,
      subject: 'Weekly Revenue Report',
      html: reportBody,
    });

    res.json({
      success: true,
      message: 'Report generated',
      stats: {
        total_users: filteredUsers.length,
        new_users: newUsers.length,
        active_subscriptions: activeSubs.length,
        monthly_revenue: monthlyRevenue.toFixed(2),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
}
