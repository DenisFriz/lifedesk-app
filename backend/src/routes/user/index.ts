import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User, Subscription } from '@models/index.js';
import { cloudinary } from '@lib/cloudinary.js';
import { comparePassword, hashPassword } from '@lib/bcrypt.js';
import { sanitizeUser } from '@utils/sanitizeUser.js';
import { requireAuth } from '@middleware/auth.js';
import { AuthenticatedRequest } from '@/@types/auth.js';

import { UserUsage } from '@/models/UserUsage.js';
import { SUBSCRIPTION_LIMITS } from '@/config/subscriptionLimits.js';
import { Types } from 'mongoose';
import { validate } from '@/utils/validate.js';
import { googleLoginSchema } from '@/schemas/auth.schema.js';
import {
  twoFactorVerifySchema,
  changeEmailRequestSchema,
  confirmEmailChangeSchema,
  disable2FASchema,
  generateRecoveryCodesSchema,
  changePasswordSchema,
} from '@/schemas/user.schema.js';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { HEALTH_CONSENT_VERSION } from '@/config/healthConsent.js';
import { deleteAllHealthData } from '@/utils/deleteHealthData.js';
import {
  enqueueEmailChangeConfirmationEmail,
  enqueueEmailChangeNoticeToOldAddressEmail,
  enqueuePasswordChangedEmail,
} from '@/utils/emailVerification.js';
import crypto from 'crypto';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

authenticator.options = { window: 1 };

// ME
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userResponse = sanitizeUser(req.user);
    const passwordDoc = await User.findById(req.user._id).select('passwordHash').lean();
    const hasPassword = !!passwordDoc?.passwordHash;

    res.json({
      id: userResponse._id,
      email: userResponse.email,
      full_name: userResponse.full_name,
      profile_image: userResponse.profile_image_url,
      profile_image_public_id: userResponse.profile_image_public_id,
      google_avatar_url: userResponse.google_avatar_url,
      auth_provider: userResponse.auth_provider,
      hasPassword,
      subscription_tier: userResponse.subscription_tier,
      role: userResponse.role,
      email_verified: userResponse.email_verified,
      twoFactorEnabled: userResponse.twoFactorEnabled,
      is_deleted: userResponse.is_deleted,
      healthConsentGiven: userResponse.healthConsentGiven,
      healthConsentDate: userResponse.healthConsentDate,
      healthConsentVersion: userResponse.healthConsentVersion,
    });
  }),
);

// SUBSCRIPTION
router.get(
  '/subscription',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let sub = await Subscription.findOne({
      user_id: req.user._id,
    }).lean();

    if (!sub) {
      sub = await Subscription.findOne({
        user_email: req.user.email,
      }).lean();
    }

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
      community_comment: currentPlanLimits.community_comment ?? false,
      community_like: currentPlanLimits.community_like ?? false,
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

// 2FA SETUP
router.post(
  '/2fa/setup',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.twoFactorEnabled) {
      throw new AppError('2FA is already enabled', 400);
    }

    const secret = authenticator.generateSecret();
    const otpauthUri = authenticator.keyuri(user.email, 'LifeDesk', secret);
    const qrCode = await QRCode.toDataURL(otpauthUri);

    user.twoFactorSecret = secret;
    await user.save();

    res.json({ qrCode, secret });
  }),
);

// 2FA VERIFY
router.post(
  '/2fa/verify',
  requireAuth,
  validate(twoFactorVerifySchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { token } = req.body;

    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.twoFactorSecret) {
      throw new AppError('Run 2FA setup first', 400);
    }

    const isValid = authenticator.verify({ token, secret: user.twoFactorSecret });

    if (!isValid) {
      throw new AppError('Invalid verification code', 401);
    }

    user.twoFactorEnabled = true;
    await user.save();

    res.json({ success: true, twoFactorEnabled: true });
  }),
);

// HEALTH CONSENT ENABLE
router.post(
  '/health-consent/enable',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.healthConsentGiven = true;
    user.healthConsentDate = new Date();
    user.healthConsentVersion = HEALTH_CONSENT_VERSION;
    await user.save();

    res.json({
      success: true,
      healthConsentGiven: user.healthConsentGiven,
      healthConsentDate: user.healthConsentDate,
      healthConsentVersion: user.healthConsentVersion,
    });
  }),
);

// HEALTH CONSENT WITHDRAW
router.post(
  '/health-consent/withdraw',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.healthConsentGiven) {
      throw new AppError('Health consent has not been given', 400);
    }

    await deleteAllHealthData(req.user._id);

    await User.updateOne(
      { _id: req.user._id },
      {
        $set: {
          healthConsentGiven: false,
        },
        $unset: {
          healthConsentDate: '',
          healthConsentVersion: '',
        },
      },
    );

    res.json({
      success: true,
      healthConsentGiven: false,
    });
  }),
);

// CHANGE EMAIL REQUEST
router.post(
  '/change-email',
  requireAuth,
  validate(changeEmailRequestSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { newEmail }: { newEmail: string } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (newEmail === user.email) {
      throw new AppError('New email must be different', 400);
    }

    const existingUser = await User.findOne({
      email: newEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const token = crypto.randomUUID();

    user.pendingEmail = newEmail;
    user.emailChangeToken = token;
    user.emailChangeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await user.save();

    await Promise.all([
      enqueueEmailChangeConfirmationEmail(
        newEmail,
        user.full_name || 'there',
        token,
      ),
      enqueueEmailChangeNoticeToOldAddressEmail(
        user.email,
        user.full_name || 'there',
      ),
    ]);

    res.json({ message: 'Confirmation email sent to new address' });
  }),
);

// CONFIRM EMAIL CHANGE
router.post(
  '/change-email/confirm',
  validate(confirmEmailChangeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token }: { token: string } = req.body;

    const user = await User.findOne({
      emailChangeToken: token,
      emailChangeExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired confirmation link', 400);
    }

    const existingUser = await User.findOne({
      email: user.pendingEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      user.pendingEmail = null;
      user.emailChangeToken = null;
      user.emailChangeExpires = null;
      await user.save();
      throw new AppError('That email address is no longer available', 409);
    }

    const newEmail = user.pendingEmail!;

    user.email = newEmail;
    user.pendingEmail = null;
    user.emailChangeToken = null;
    user.emailChangeExpires = null;
    user.email_verified = true;

    try {
      await user.save();
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.email) {
        throw new AppError('That email address is no longer available', 409);
      }
      throw err;
    }

    await Subscription.updateMany(
      { user_id: user._id },
      { $set: { user_email: newEmail } },
    );

    const subscriptionsWithCustomer = await Subscription.find({
      user_id: user._id,
      stripe_customer_id: { $ne: null },
    })
      .lean()
      .select('stripe_customer_id');

    const customerIds = [
      ...new Set(
        subscriptionsWithCustomer
          .map((sub) => sub.stripe_customer_id)
          .filter((id): id is string => !!id),
      ),
    ];

    await Promise.all(
      customerIds.map(async (customerId) => {
        try {
          await stripe.customers.update(customerId, { email: newEmail });
        } catch (err: any) {
          console.error(
            'Failed to update Stripe customer email:',
            err?.message || err,
          );
        }
      }),
    );

    res.json({ message: 'Email address updated successfully' });
  }),
);

// 2FA DISABLE
router.post(
  '/2fa/disable',
  requireAuth,
  validate(disable2FASchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { password }: { password: string } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.twoFactorEnabled) {
      throw new AppError('2FA is not enabled', 400);
    }

    const valid = await comparePassword(password, user.passwordHash || '');

    if (!valid) {
      throw new AppError('Invalid password', 401);
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    res.json({ success: true, twoFactorEnabled: false });
  }),
);

// 2FA GENERATE RECOVERY CODES
router.post(
  '/2fa/recovery-codes/generate',
  requireAuth,
  validate(generateRecoveryCodesSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { password }: { password: string } = req.body;

    const user = await User.findById(req.user._id).select(
      '+passwordHash +twoFactorRecoveryCodes',
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.twoFactorEnabled) {
      throw new AppError('2FA must be enabled to generate recovery codes', 400);
    }

    const valid = await comparePassword(password, user.passwordHash || '');

    if (!valid) {
      throw new AppError('Invalid password', 401);
    }

    const codes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(5).toString('hex'),
    );

    const hashedCodes = await Promise.all(codes.map((code) => hashPassword(code)));

    user.twoFactorRecoveryCodes = hashedCodes;
    await user.save();

    res.json({ recoveryCodes: codes });
  }),
);

// CHANGE PASSWORD
router.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { currentPassword, newPassword }: { currentPassword?: string; newPassword: string } = req.body;

    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const hasExistingPassword = !!user.passwordHash;

    if (hasExistingPassword) {
      if (!currentPassword) {
        throw new AppError('Current password is required', 400);
      }

      const valid = await comparePassword(currentPassword, user.passwordHash || '');

      if (!valid) {
        throw new AppError('Invalid password', 401);
      }

      if (currentPassword === newPassword) {
        throw new AppError('New password must be different from current password', 400);
      }
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    await enqueuePasswordChangedEmail(
      user.email,
      user.full_name || 'there',
    );

    res.json({ success: true });
  }),
);

export default router;
