import { Router, type Request, type Response } from 'express';

import { LoginDTO, RegisterDTO } from './types.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User } from '@models/index.js';
import { comparePassword, hashPassword } from '@lib/bcrypt.js';
import { sanitizeUser } from '@utils/sanitizeUser.js';

import { OAuth2Client } from 'google-auth-library';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from '@/utils/token.utils.js';
import { authenticator } from 'otplib';
import { RefreshToken } from '@/models/RefreshToken.js';
import crypto from 'crypto';
import {
  issueAuthSession,
  getRefreshCookieOptions,
} from '@/utils/issueAuthSession.js';
import { validate } from '@/utils/validate.js';
import {
  forgotPasswordSchema,
  googleCallbackSchema,
  googleLoginSchema,
  loginUserSchema,
  loginTwoFactorSchema,
  registerUserSchema,
  resetPasswordSchema,
} from '@/schemas/auth.schema.js';
import z from 'zod';
import {
  verificationReminderQueue,
  verificationReminderJobId,
} from '@/queues/verificationReminderQueue.js';
import {
  createEmailVerificationToken,
  getEmailVerificationExpires,
  enqueueEmailVerificationEmail,
  enqueuePasswordResetRequestEmail,
  enqueuePasswordChangedEmail,
  enqueueRegistrationCompletedEmail,
} from '@/utils/emailVerification.js';

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
);

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

authenticator.options = { window: 1 };

type GoogleLoginDTO = z.infer<typeof googleLoginSchema>;

async function ensureUserUsage(userId: string) {
  const { UserUsage } = await import('@/models/UserUsage.js');
  await UserUsage.updateOne(
    { user_id: userId },
    {
      $setOnInsert: {
        goals: 0,
        tasks: 0,
        calendarEntries: 0,
        events: 0,
        assets: 0,
        bankAccounts: 0,
        workouts: 0,
        projects: 0,
      },
    },
    { upsert: true },
  );
}

const router = Router();

// REGISTER
router.post(
  '/register',
  validate(registerUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: RegisterDTO = req.body;

    const existing = await User.findOne({ email });

    if (existing) {
      throw new AppError('User already exists', 400);
    }

    const passwordHash = await hashPassword(password);
    const verificationToken = createEmailVerificationToken();

    const user = new User({
      email,
      passwordHash,
      terms_accepted_at: new Date().toISOString(),
      emailVerificationCode: verificationToken,
      emailVerificationExpires: getEmailVerificationExpires(),
    });

    await Promise.all([user.save(), ensureUserUsage(user._id.toString())]);

    const { accessToken } = await issueAuthSession(user._id.toString(), res, req);

    const displayName = user.full_name || 'there';

    await Promise.all([
      enqueueEmailVerificationEmail(user.email, displayName, verificationToken),
      verificationReminderQueue.add(
        'verification-reminder',
        { userId: user._id.toString() },
        {
          jobId: verificationReminderJobId(user._id.toString()),
          delay: 24 * 60 * 60 * 1000,
          removeOnComplete: true,
          removeOnFail: false,
        },
      ),
    ]);

    const userResponse = sanitizeUser(user);

    res.json({
      accessToken,
      user: userResponse,
    });
  }),
);

// LOGIN
router.post(
  '/login',
  validate(loginUserSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password }: LoginDTO = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
      throw new AppError('Incorrect email or password', 404);
    }

    if (!user.passwordHash) {
      throw new AppError(
        'Password login is not available for this account',
        400,
      );
    }

    const valid = await comparePassword(password, user.passwordHash);

    if (!valid) {
      throw new AppError('Incorrect email or password', 404);
    }

    if (user.twoFactorEnabled) {
      res.json({ requiresTwoFactor: true });
      return;
    }

    const [{ accessToken }] = await Promise.all([
      issueAuthSession(user._id.toString(), res, req),
      ensureUserUsage(user._id.toString()),
    ]);

    const userResponse = sanitizeUser(user);

    res.json({
      accessToken,
      user: userResponse,
    });
  }),
);

// LOGIN WITH 2FA
router.post(
  '/login/2fa',
  validate(loginTwoFactorSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, token, recoveryCode } = req.body;

    const user = await User.findOne({ email }).select(
      '+passwordHash +twoFactorSecret +twoFactorRecoveryCodes',
    );

    if (!user) {
      throw new AppError('Incorrect email or password', 404);
    }

    if (!user.passwordHash) {
      throw new AppError(
        'Password login is not available for this account',
        400,
      );
    }

    const valid = await comparePassword(password, user.passwordHash);

    if (!valid) {
      throw new AppError('Incorrect email or password', 404);
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError('2FA is not enabled for this account', 400);
    }

    let authValid = false;

    if (token) {
      authValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
      });
    } else if (recoveryCode) {
      for (let i = 0; i < user.twoFactorRecoveryCodes!.length; i++) {
        const matches = await comparePassword(
          recoveryCode,
          user.twoFactorRecoveryCodes![i],
        );
        if (matches) {
          user.twoFactorRecoveryCodes!.splice(i, 1);
          await user.save();
          authValid = true;
          break;
        }
      }
    }

    if (!authValid) {
      throw new AppError('Invalid verification code', 401);
    }

    const [{ accessToken }] = await Promise.all([
      issueAuthSession(user._id.toString(), res, req),
      ensureUserUsage(user._id.toString()),
    ]);

    const userResponse = sanitizeUser(user);

    res.json({
      accessToken,
      user: userResponse,
    });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (!token || typeof token !== 'string') {
      return res.status(200).json({ message: 'Already logged out' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await RefreshToken.findOneAndUpdate(
      { token_hash: tokenHash },
      { $set: { revoked: true } },
    );

    res.clearCookie('refreshToken', {
      ...getRefreshCookieOptions(),
    });

    res.json({ message: 'Logged out successfully' });
  }),
);

// GOOGLE LOGIN
router.post(
  '/google',
  validate(googleLoginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { credential }: GoogleLoginDTO = req.body;

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new AppError('Invalid Google token', 401);
    }

    const { sub, email, name, picture, email_verified } = payload;

    if (!email) {
      throw new AppError('Google account has no email', 400);
    }

    let user = await User.findOne({
      $or: [{ google_id: sub }, { email }],
    });

    if (!user) {
      user = await User.create({
        email,
        full_name: name,
        google_id: sub,
        google_avatar_url: picture,
        auth_provider: 'google',
        email_verified,
        passwordHash: null,
      });
      if (email_verified) {
        await enqueueRegistrationCompletedEmail(
          user.email,
          user.full_name || 'there',
        );
      }
    } else {
      if (!user.google_id) {
        const wasVerified = user.email_verified;
        user.google_id = sub;
        user.google_avatar_url = picture ?? null;
        user.auth_provider = 'google';
        user.email_verified = true;

        await user.save();
        if (!wasVerified) {
          await enqueueRegistrationCompletedEmail(
            user.email,
            user.full_name || 'there',
          );
        }
      }
    }

    const [{ accessToken }] = await Promise.all([
      issueAuthSession(user._id.toString(), res, req),
      ensureUserUsage(user._id.toString()),
    ]);

    const userResponse = sanitizeUser(user);

    res.json({
      accessToken,
      user: userResponse,
    });
  }),
);

// GOOGLE OAUTH2 CALLBACK (authorization code flow)
router.post(
  '/google/callback',
  validate(googleCallbackSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { code, redirectUri } = req.body as {
      code: string;
      redirectUri: string;
    };

    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: redirectUri,
    });

    const idToken = tokens.id_token;
    if (!idToken) {
      throw new AppError('No ID token in Google response', 401);
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError('Invalid Google token', 401);
    }

    const { sub, email, name, picture, email_verified } = payload;

    if (!email) {
      throw new AppError('Google account has no email', 400);
    }

    let user = await User.findOne({ $or: [{ google_id: sub }, { email }] });

    if (!user) {
      user = await User.create({
        email,
        full_name: name,
        google_id: sub,
        google_avatar_url: picture,
        auth_provider: 'google',
        email_verified,
        passwordHash: null,
      });
      if (email_verified) {
        await enqueueRegistrationCompletedEmail(
          user.email,
          user.full_name || 'there',
        );
      }
    } else {
      if (!user.google_id) {
        const wasVerified = user.email_verified;
        user.google_id = sub;
        user.google_avatar_url = picture ?? null;
        user.auth_provider = 'google';
        user.email_verified = true;
        await user.save();
        if (!wasVerified) {
          await enqueueRegistrationCompletedEmail(
            user.email,
            user.full_name || 'there',
          );
        }
      }
    }

    const [{ accessToken }] = await Promise.all([
      issueAuthSession(user._id.toString(), res, req),
      ensureUserUsage(user._id.toString()),
    ]);

    const userResponse = sanitizeUser(user);

    res.json({ accessToken, user: userResponse });
  }),
);

// REFRESH TOKEN
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken;

    if (!token) {
      throw new AppError('Refresh token missing', 401);
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const storedToken = await RefreshToken.findOne({
      user_id: payload.userId,
      token_hash: tokenHash,
    });

    if (!storedToken) {
      return res.status(401).json({
        error: 'Refresh token not found',
        code: 'REFRESH_TOKEN_NOT_FOUND',
      });
    }

    if (storedToken.revoked) {
      return res.status(401).json({
        error: 'Refresh token revoked',
        code: 'REFRESH_TOKEN_REVOKED',
      });
    }

    if (storedToken.expires_at < new Date()) {
      return res.status(401).json({
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    const accessToken = createAccessToken(payload.userId);

    const { token: newRefreshToken } = createRefreshToken(payload.userId);

    const newHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await Promise.all([
      storedToken.updateOne({ revoked: true }),
      RefreshToken.create({
        user_id: payload.userId,
        token_hash: newHash,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
        revoked: false,
      }),
    ]);

    res.cookie('refreshToken', newRefreshToken, {
      ...getRefreshCookieOptions(),
      maxAge: REFRESH_TOKEN_TTL_MS,
    });

    res.json({
      accessToken,
    });
  }),
);

// FORGOT PASSWORD
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email }: { email: string } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('No account found with this email', 404);
    }

    const token = crypto.randomUUID();

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 MINUTES

    await user.save();

    await enqueuePasswordResetRequestEmail(
      user.email,
      user.full_name || 'there',
      token,
    );

    res.json({ message: 'If user exists, email was sent' });
  }),
);

// RESET PASSWORD
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired token', 400);
    }

    user.passwordHash = await hashPassword(newPassword);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    await enqueuePasswordChangedEmail(
      user.email,
      user.full_name || 'there',
    );

    res.json({ message: 'Password successfully reset' });
  }),
);

export default router;
