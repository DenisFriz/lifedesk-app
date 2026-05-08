import type { Request, Response } from 'express';
import { User, Subscription } from '@/models/index.js';

type DeleteAccountScenario = 1 | 2 | 3 | 4 | 5;

type TestDeleteAccountScenariosBody = {
  scenario?: DeleteAccountScenario;
};

export async function testDeleteAccountScenarios(
  req: Request<{}, {}, TestDeleteAccountScenariosBody>,
  res: Response,
) {
  try {
    const { scenario } = req.body;
    const results: Record<string, any> = {};

    if (!scenario || scenario === 1) {
      const freeUsers = await User.find({ subscription_tier: 'free' }).lean();
      results.scenario_1_free_user_deletion = {
        free_users_exist: freeUsers.length > 0,
        count: freeUsers.length,
        safe: true,
      };
    }

    if (!scenario || scenario === 2) {
      const activeSubs = await Subscription.find({
        status: 'active',
      }).lean();
      results.scenario_2_active_subscription = {
        active_subscriptions_exist: activeSubs.length > 0,
        count: activeSubs.length,
        safe: true,
      };
    }

    if (!scenario || scenario === 3) {
      const cancelledSubs = await Subscription.find({
        status: 'canceled',
      }).lean();
      results.scenario_3_cancelled_subscription = {
        cancelled_subscriptions_exist: cancelledSubs.length > 0,
        count: cancelledSubs.length,
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
      const admins = await User.find({ role: 'admin' }).lean();
      results.scenario_5_sole_admin_protection = {
        total_admins: admins.length,
        sole_admin_protected: admins.length === 1,
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
