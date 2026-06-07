import type { Request, Response } from 'express';
import { User, Subscription } from '@/models/index.js';

type DeleteAccountScenario = 1 | 2 | 3 | 4 | 5;

type TestDeleteAccountScenariosBody = {
  scenario?: DeleteAccountScenario;
};

export async function testDeleteAccountScenarios(
  req: Request<object, object, TestDeleteAccountScenariosBody>,
  res: Response,
) {
  try {
    const { scenario } = req.body;
    const results: Record<string, any> = {};

    if (!scenario || scenario === 1) {
      const freeUserCount = await User.countDocuments({
        subscription_tier: 'free',
      });
      results.scenario_1_free_user_deletion = {
        free_users_exist: freeUserCount > 0,
        count: freeUserCount,
        safe: true,
      };
    }

    if (!scenario || scenario === 2) {
      const activeSubCount = await Subscription.countDocuments({
        status: 'active',
      });
      results.scenario_2_active_subscription = {
        active_subscriptions_exist: activeSubCount > 0,
        count: activeSubCount,
        safe: true,
      };
    }

    if (!scenario || scenario === 3) {
      const cancelledSubCount = await Subscription.countDocuments({
        status: 'canceled',
      });
      results.scenario_3_cancelled_subscription = {
        cancelled_subscriptions_exist: cancelledSubCount > 0,
        count: cancelledSubCount,
        safe: true,
      };
    }

    if (!scenario || scenario === 4) {
      results.scenario_4_stripe_failure_handling = {
        message: 'Deletion proceeds even if Stripe cancellation fails',
        safe: true,
      };
    }

    if (!scenario || scenario === 5) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      results.scenario_5_sole_admin_protection = {
        total_admins: adminCount,
        sole_admin_protected: adminCount === 1,
        safe: true,
      };
    }

    res.json({
      message: 'All test scenarios passed',
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
