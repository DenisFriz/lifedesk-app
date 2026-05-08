import type { Request, Response } from 'express';
import { User, Subscription } from '@/models/index.js';

export async function weeklyRevenueReport(req: Request, res: Response) {
  try {
    const users = await User.find({}).lean();
    const subscriptions = await Subscription.find({}).lean();

    const adminEmail = 'info@agentur-braun.de';
    const testUser = 'a.braun@agentur-braun.de';

    const filteredUsers = users.filter(
      (u) =>
        u.email !== adminEmail && u.email !== testUser && u.role !== 'admin',
    );

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = filteredUsers.filter(
      (u) => new Date(u.created_at) >= sevenDaysAgo,
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

    console.log(
      `[EMAIL] To: ${adminEmail}\nSubject: Weekly Revenue Report\n${reportBody}`,
    );

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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
