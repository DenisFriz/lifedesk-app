import type { Request, Response } from 'express';
import Stripe from 'stripe';
import { User, Subscription, modelMap } from '@/models/index.js';
import { UserUsage } from '@/models/UserUsage.js';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { cloudinary } from '@/lib/cloudinary.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

const CLOUDINARY_URL_FIELDS: Record<string, string> = {
  medicaldocument: 'file_url',
  progressphoto: 'image_url',
};

function extractCloudinaryInfo(
  url: string,
): { publicId: string; resourceType: 'image' | 'video' | 'raw' } | null {
  try {
    const match = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)/);
    if (!match) return null;
    const resourceType = match[1] as 'image' | 'video' | 'raw';
    let publicId = match[2];
    if (resourceType !== 'raw') {
      publicId = publicId.replace(/\.[^/.]+$/, ''); // strip extension for image/video
    }
    return { publicId, resourceType };
  } catch {
    return null;
  }
}

type ReauthTokenPayload = {
  type: 'reauth';
  scope: 'delete_account';
  userId: string;
};

export async function deleteAccount(req: Request, res: Response) {
  try {
    const currentUser = req.user;

    if (!currentUser) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const { reauthToken } = req.body;

    if (!reauthToken || typeof reauthToken !== 'string') {
      return res.status(400).json({
        error: 'Reauthentication token is required',
      });
    }

    let decoded: ReauthTokenPayload;

    try {
      decoded = jwt.verify(
        reauthToken,
        process.env.JWT_SECRET!,
      ) as ReauthTokenPayload;
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid or expired reauthentication token',
      });
    }

    // Validate token type
    if (decoded.type !== 'reauth') {
      return res.status(401).json({
        error: 'Invalid token type',
      });
    }

    // Validate token scope
    if (decoded.scope !== 'delete_account') {
      return res.status(401).json({
        error: 'Invalid token scope',
      });
    }

    // Prevent using someone else's token
    if (decoded.userId !== currentUser._id.toString()) {
      return res.status(403).json({
        error: 'Token does not belong to current user',
      });
    }

    // Always fetch fresh user
    const user = await User.findById(decoded.userId)
      .lean()
      .select('_id id role');

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        error:
          'Admin accounts cannot be deleted through this flow. Please contact support.',
      });
    }
    const allAdmins = await User.find({ role: 'admin' }).lean().select('id');

    if (allAdmins.length === 1 && allAdmins[0].id === user.id) {
      return res.status(403).json({
        error:
          'You are the sole admin of this app and cannot delete your account.',
      });
    }

    const now = new Date().toISOString();
    const userId = new Types.ObjectId(user._id);

    const subscriptions = await Subscription.find({
      user_email: user.email,
    })
      .lean()
      .select('stripe_subscription_id _id');

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
            '[deleteAccount] Stripe cancellation failed:',
            stripeError.message,
          );
        }
      }
    }

    await Subscription.deleteMany({
      user_email: user.email,
    });

    for (const entityName of HARD_DELETE_ENTITIES) {
      try {
        const model = modelMap[entityName.toLowerCase()];

        if (!model) {
          console.warn(
            `[deleteAccount] Missing model in modelMap: ${entityName}`,
          );
          continue;
        }

        // Cleanup Cloudinary assets for entities with URL fields
        const urlField = CLOUDINARY_URL_FIELDS[entityName.toLowerCase()];
        if (urlField) {
          try {
            const records = await model
              .find({ created_by: userId })
              .select(urlField)
              .lean();

            const grouped: Record<string, string[]> = {};
            for (const rec of records) {
              const url = (rec as any)[urlField];
              if (!url) continue;
              const info = extractCloudinaryInfo(url);
              if (!info) continue;
              (grouped[info.resourceType] ??= []).push(info.publicId);
            }

            await Promise.allSettled(
              Object.entries(grouped).map(([resourceType, ids]) =>
                cloudinary.api.delete_resources(ids, {
                  resource_type: resourceType as any,
                }),
              ),
            );
          } catch (err: any) {
            console.warn(
              `[deleteAccount] Cloudinary cleanup failed for ${entityName}:`,
              err.message,
            );
          }
        }

        await model.deleteMany({
          created_by: userId,
        });
      } catch (err: any) {
        console.warn(
          `[deleteAccount] Hard delete failed for ${entityName}:`,
          err.message,
        );
      }
    }

    for (const entityName of SOFT_DELETE_ENTITIES) {
      try {
        const model = modelMap[entityName.toLowerCase()];

        if (!model) {
          console.warn(
            `[deleteAccount] Missing model in modelMap: ${entityName}`,
          );
          continue;
        }

        await model.updateMany(
          {
            created_by: userId,
            is_deleted: false,
          },
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

    const realUserId = user._id as Types.ObjectId;

    try {
      await UserUsage.deleteOne({
        user_id: realUserId,
      });
    } catch (err: any) {
      console.warn('[deleteAccount] Failed to delete UserUsage:', err.message);
    }

    try {
      await User.deleteOne({
        _id: user._id,
      });
    } catch (deleteError: any) {
      console.error(
        '[deleteAccount] Failed to delete user record:',
        deleteError.message,
      );

      return res.status(500).json({
        error: 'Failed to complete account deletion. Please contact support.',
      });
    }

    return res.json({
      success: true,
      message: 'Account deletion completed',
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred';

    return res.status(500).json({
      error: message,
    });
  }
}
