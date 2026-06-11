import { Router, type Request, type Response } from 'express';

import { LoginDTO, RegisterDTO } from './types.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User } from '@models/index.js';
import { comparePassword, hashPassword } from '@lib/bcrypt.js';
import { sanitizeUser } from '@utils/sanitizeUser.js';

import { Resend } from 'resend';

import fs from 'fs';
import path from 'path';

import { OAuth2Client } from 'google-auth-library';
import {
  createAccessToken,
  createRefreshToken,
  verifyRefreshToken,
} from '@/utils/token.utils.js';
import { RefreshToken } from '@/models/RefreshToken.js';
import crypto from 'crypto';
import { issueAuthSession } from '@/utils/issueAuthSession.js';
import { validate } from '@/utils/validate.js';
import {
  forgotPasswordSchema,
  googleLoginSchema,
  loginUserSchema,
  registerUserSchema,
  resetPasswordSchema,
} from '@/schemas/auth.schema.js';
import z from 'zod';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type GoogleLoginDTO = z.infer<typeof googleLoginSchema>;

let resetPasswordTemplate: string | null = null;

function getResetPasswordTemplate(resetLink: string, name: string) {
  if (!resetPasswordTemplate) {
    const filePath = path.join(
      process.cwd(),
      'src/templates/reset-password.html',
    );
    resetPasswordTemplate = fs.readFileSync(filePath, 'utf-8');
  }

  let html = resetPasswordTemplate;
  html = html.replaceAll('{{RESET_LINK}}', resetLink);
  html = html.replaceAll('{{NAME}}', name);

  return html;
}

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

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const user = new User({
      email,
      passwordHash,
      terms_accepted_at: new Date().toISOString(),
    });

    await Promise.all([user.save(), ensureUserUsage(user._id.toString())]);

    const { accessToken } = await issueAuthSession(user._id.toString(), res);

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

    const user = await User.findOne({ email });

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

    const [{ accessToken }] = await Promise.all([
      issueAuthSession(user._id.toString(), res),
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
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
    } else {
      if (!user.google_id) {
        user.google_id = sub;
        user.google_avatar_url = picture ?? null;
        user.auth_provider = 'google';
        user.email_verified = true;

        await user.save();
      }
    }

    const [{ accessToken }] = await Promise.all([
      issueAuthSession(user._id.toString(), res),
      ensureUserUsage(user._id.toString()),
    ]);

    const userResponse = sanitizeUser(user);

    res.json({
      accessToken,
      user: userResponse,
    });
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
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
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
      return res.json({ message: 'If user exists, email was sent' });
    }

    const token = crypto.randomUUID();

    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 MINUTES

    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/ResetPassword?token=${token}`;

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Reset your password',
      html: getResetPasswordTemplate(resetLink, user.full_name || 'there'),
    });

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

    res.json({ message: 'Password successfully reset' });
  }),
);

export default router;
