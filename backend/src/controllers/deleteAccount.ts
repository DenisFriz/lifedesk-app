import type { Request, Response } from 'express';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';
import { User, Subscription, modelMap } from '@/models/index.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const APP_OWNER_EMAIL = 'info@agentur-braun.de';

const HARD_DELETE_ENTITIES = [
  'Income',
  'Expense',
  'RecurringIncome',
  'RecurringExpense',
  'BankBalanceSnapshot',
  'BodyMeasurement',
  'Workout',
  'ProgressPhoto',
  'MedicalDocument',
  'TimeEntry',
  'Note',
];

const SOFT_DELETE_ENTITIES = [
  'Task',
  'Goal',
  'Problem',
  'Event',
  'Business',
  'Project',
  'Client',
  'Hobby',
  'LearningItem',
  'Contact',
  'OfflineAccount',
  'WorkoutPlan',
  'MarketingStrategy',
  'MarketingCampaign',
  'Idea',
  'ContentIdea',
];

export async function deleteAccount(req: Request, res: Response) {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        error:
          'Admin accounts cannot be deleted through this flow. Please contact support.',
      });
    }

    if (user.email === APP_OWNER_EMAIL) {
      return res.status(403).json({
        error: 'App owner account cannot be deleted through this flow.',
      });
    }

    const allAdmins = await User.find({ role: 'admin' }).lean();
    if (allAdmins.length === 1 && allAdmins[0].id === user.id) {
      return res.status(403).json({
        error:
          'You are the sole admin of this app and cannot delete your account.',
      });
    }

    const { password } = req.body;
    if (!password || (password as string).trim().length === 0) {
      return res.status(400).json({
        error: 'Password is required to delete your account.',
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        error: 'Incorrect password. Please try again.',
      });
    }

    const now = new Date().toISOString();
    const userId = user.id;

    const subscriptions = await Subscription.find({
      user_email: user.email,
    }).lean();
    for (const subscription of subscriptions) {
      if (subscription.stripe_subscription_id) {
        try {
          await stripe.subscriptions.update(
            subscription.stripe_subscription_id,
            {
              cancel_at_period_end: true,
            },
          );
        } catch (stripeError: any) {
          console.error(
            `[deleteAccount] Stripe cancellation failed:`,
            stripeError.message,
          );
        }
      }
    }
    await Subscription.deleteMany({ user_email: user.email });

    for (const entityName of HARD_DELETE_ENTITIES) {
      try {
        await modelMap[entityName].deleteMany({ created_by: userId });
      } catch (err: any) {
        console.warn(
          `[deleteAccount] Hard delete failed for ${entityName}:`,
          err.message,
        );
      }
    }

    for (const entityName of SOFT_DELETE_ENTITIES) {
      try {
        await modelMap[entityName].updateMany(
          { created_by: userId, is_deleted: false },
          {
            $set: {
              is_deleted: true,
              deleted_at: now,
              deleted_by_process: 'account_deletion',
            },
          },
        );
      } catch (err: any) {
        console.warn(
          `[deleteAccount] Soft delete failed for ${entityName}:`,
          err.message,
        );
      }
    }

    try {
      await User.deleteOne({ id: userId });
      console.log(
        `[deleteAccount] User record hard-deleted for: ${user.email}`,
      );
    } catch (deleteError: any) {
      console.error(
        '[deleteAccount] Failed to delete user record:',
        deleteError.message,
      );
      return res.status(500).json({
        error: 'Failed to complete account deletion. Please contact support.',
      });
    }

    res.json({
      success: true,
      message: 'Account deletion completed',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'An unexpected error occurred. Please contact support.',
    });
  }
}
