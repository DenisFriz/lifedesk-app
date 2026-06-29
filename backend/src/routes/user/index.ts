import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User, Subscription } from '@models/index.js';
import { cloudinary } from '@lib/cloudinary.js';
import { comparePassword } from '@lib/bcrypt.js';
import { sanitizeUser } from '@utils/sanitizeUser.js';
import { requireAuth } from '@middleware/auth.js';
import { AuthenticatedRequest } from '@/@types/auth.js';

import { UserUsage } from '@/models/UserUsage.js';
import {
  SUBSCRIPTION_LIMITS,
  HARD_CAPPED_KEYS,
  type SubscriptionLimits,
} from '@/config/subscriptionLimits.js';
import { Types } from 'mongoose';
import { validate } from '@/utils/validate.js';
import { googleLoginSchema } from '@/schemas/auth.schema.js';
import jwt from 'jsonwebtoken';

const router = Router();

// ME
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userResponse = sanitizeUser(req.user);

    res.json({
      id: userResponse._id,
      email: userResponse.email,
      full_name: userResponse.full_name,
      profile_image: userResponse.profile_image_url,
      profile_image_public_id: userResponse.profile_image_public_id,
      google_avatar_url: userResponse.google_avatar_url,
      subscription_tier: userResponse.subscription_tier,
      role: userResponse.role,
      email_verified: userResponse.email_verified,
      is_deleted: userResponse.is_deleted,
    });
  }),
);

// SUBSCRIPTION
router.get(
  '/subscription',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const sub = await Subscription.findOne({ user_email: req.user.email }).lean();
    res.json(sub || null);
  }),
);

// UPDATE ME
router.put(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const allowedFields = [
      'full_name',
      'avatar',
      'bio',
      'terms_accepted_at',
      'terms_accepted_version',
      'profile_image_url',
      'profile_image_public_id',
    ];

    const updateData: Record<string, any> = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const updated = await User.findOneAndUpdate(
      { _id: req.user._id },
      {
        $set: {
          ...updateData,
          updated_at: new Date().toISOString(),
        },
      },
      { returnDocument: 'after' },
    );

    if (!updated) {
      throw new AppError('User not found', 404);
    }

    const userResponse = sanitizeUser(updated);

    res.json(userResponse);
  }),
);

// DELETE USER AVATAR
router.delete(
  '/profile-image',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user._id).lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profile_image_public_id) {
      try {
        const result = await cloudinary.uploader.destroy(
          user.profile_image_public_id,
        );

        if (result.result !== 'ok' && result.result !== 'not found') {
          console.error('Cloudinary delete failed:', result);
        }
      } catch (err) {
        console.error('Cloudinary error:', err);
      }
    }

    await User.updateOne(
      { _id: req.user._id },
      {
        $unset: {
          profile_image_url: '',
          profile_image_public_id: '',
        },
      },
    );

    res.json({ success: true });
  }),
);

// USAGE
router.get(
  '/usage',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId: Types.ObjectId = req.user._id;

    const userUsed = await UserUsage.findOne({ user_id: userId }).lean();

    const userPlan = req.user.subscription_tier;

    if (!userUsed) {
      throw new AppError('Unable to load usage information', 404);
    }

    const currentPlanLimits = SUBSCRIPTION_LIMITS[userPlan ?? 'free'];

    const usage = {
      goals: userUsed.goals ?? 0,
      tasks: userUsed.tasks ?? 0,
      calendarEntries: userUsed.calendarEntries ?? 0,
      events: userUsed.events ?? 0,
      vehicle: userUsed.vehicle ?? 0,
      vehicle_photos: userUsed.vehicle_photos ?? 0,
      estate: userUsed.estate ?? 0,
      problems: userUsed.problems ?? 0,
      otherAsset: userUsed.otherAsset ?? 0,
      workoutPlans: userUsed.workoutPlans ?? 0,
      bodyMeasurements: userUsed.bodyMeasurements ?? 0,
      workouts: userUsed.workouts ?? 0,
      hobbies: userUsed.hobbies ?? 0,
      learning: userUsed.learning ?? 0,
      timeEntries: userUsed.timeEntries ?? 0,
      projects: userUsed.projects ?? 0,
      clients: userUsed.clients ?? 0,
      business: userUsed.business ?? 0,
      income: userUsed.income ?? 0,
      expense: userUsed.expense ?? 0,
      medicalDocuments: userUsed.medicalDocuments ?? 0,
      marketingStrategy: userUsed.marketingStrategy ?? 0,
      marketingCampaign: userUsed.marketingCampaign ?? 0,
      marketingContent: userUsed.marketingContent ?? 0,
      budgetEntries: userUsed.budgetEntries ?? 0,
      content: userUsed.content ?? 0,
      offlineBankAccount: userUsed.offlineBankAccount ?? 0,
      offlineAccountSnapshot: userUsed.offlineAccountSnapshot ?? 0,
      communityIdeas: userUsed.communityIdeas ?? 0,
      relationships: userUsed.relationships ?? 0,
      progressPhotos: userUsed.progressPhotos ?? 0,
      notes_words_limit: userUsed.notes_words_limit ?? 0,
      community_comment: userUsed.community_comment ?? false,
      community_like: userUsed.community_like ?? false,
      ai_assistant: currentPlanLimits.ai_assistant ?? false,
      push_notifications: currentPlanLimits.push_notifications ?? false,
    };

    const limits = Object.fromEntries(
      (Object.keys(usage) as (keyof typeof usage)[]).map((key) => {
        const limit = currentPlanLimits[key as keyof typeof currentPlanLimits];
        return [key, typeof limit === 'number' ? limit : null];
      }),
    );

    const remaining = Object.fromEntries(
      (Object.keys(usage) as (keyof typeof usage)[]).map((key) => {
        const limit = currentPlanLimits[key as keyof typeof currentPlanLimits];
        const used = usage[key] ?? 0;
        return [
          key,
          typeof limit === 'number' ? Math.max(limit - Number(used), 0) : null,
        ];
      }),
    );

    res.json({
      usage,
      limits,
      remaining,
    });
  }),
);

// DELETE REQUEST
router.get(
  '/delete/request',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dbUser = await User.findById(user._id).lean().select('auth_provider');

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      requiresReauth: true,
      provider: dbUser.auth_provider,
    });
  }),
);

// REAUTH PASSWORD
router.post(
  '/reauth/password',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    const { password } = req.body;

    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required', 400);
    }

    const dbUser = await User.findById(user._id).lean().select('+passwordHash');

    if (!dbUser) {
      throw new AppError('User not found', 404);
    }

    if (!dbUser.passwordHash) {
      throw new AppError(
        'Password authentication is not available for this account',
        400,
      );
    }

    const valid = await comparePassword(password, dbUser.passwordHash);

    if (!valid) {
      throw new AppError('Invalid password', 401);
    }

    const reauthToken = jwt.sign(
      {
        type: 'reauth',
        scope: 'delete_account',
        userId: dbUser._id.toString(),
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '5m',
      },
    );

    return res.json({
      success: true,
      reauthToken,
    });
  }),
);

// GOOGLE REAUTH
router.post(
  '/google/reauth',
  validate(googleLoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;

    interface GoogleUserInfo {
      sub: string;
      email: string;
      email_verified?: boolean;
      name?: string;
      picture?: string;
    }

    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${credential}`,
    );

    if (!response.ok) {
      throw new AppError('Invalid Google access token', 401);
    }

    const payload = (await response.json()) as GoogleUserInfo;

    if (!payload) {
      throw new AppError('Invalid Google token', 401);
    }

    const { sub, email } = payload;

    if (!email) {
      throw new AppError('Google account has no email', 400);
    }

    const user = await User.findOne({
      $or: [{ google_id: sub }, { email }],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.auth_provider !== 'google') {
      throw new AppError('Account is not Google-linked', 400);
    }

    if (user.email !== email) {
      throw new AppError('Google account mismatch', 401);
    }

    const reauthToken = jwt.sign(
      {
        userId: user._id,
        type: 'reauth',
        scope: 'delete_account',
      },
      process.env.JWT_SECRET!,
      { expiresIn: '5m' },
    );

    return res.json({
      success: true,
      reauthToken,
    });
  }),
);

// CHANGE SUBSCRIPTION
router.post(
  '/change-subscription',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { subscription }: { subscription: 'free' | 'plus' | 'pro' } =
      req.body;

    const allowed = ['free', 'plus', 'pro'] as const;

    if (!allowed.includes(subscription)) {
      return res.status(400).json({ message: 'Invalid subscription tier' });
    }

    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.subscription_tier = subscription;

    await user.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription: user.subscription_tier,
    });
  }),
);

export default router;
