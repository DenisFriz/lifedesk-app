import { Router, type Request, type Response } from 'express';

import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User } from '@models/index.js';
import { comparePassword, hashPassword } from '@lib/bcrypt.js';
import { sanitizeUser } from '@utils/sanitizeUser.js';
import { requireAuth } from '@middleware/auth.js';
import { AuthenticatedRequest } from '@/@types/auth.js';

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
import { UserUsage } from '@/models/UserUsage.js';
import { SUBSCRIPTION_LIMITS } from '@/config/subscriptionLimits.js';
import { Types } from 'mongoose';
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
import jwt from 'jsonwebtoken';

function getVerificationEmailTemplate(code: string, name: string) {
  const filePath = path.join(
    process.cwd(),
    'src/templates/email-verification.html',
  );

  let html = fs.readFileSync(filePath, 'utf-8');

  html = html.replaceAll('{{CODE}}', code);
  html = html.replaceAll('{{NAME}}', name);

  return html;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const router = Router();

router.post(
  '/send-email-verification-code',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.email_verified) {
      throw new AppError('Email already verified', 400);
    }

    const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0');

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationCode: code,
          emailVerificationExpires: new Date(Date.now() + 1000 * 60 * 10),
        },
      },
    );

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: user.email,
      subject: 'Verify your email',
      html: getVerificationEmailTemplate(code, user.full_name || 'there'),
    });

    res.json({
      message: 'Verification code sent',
    });
  }),
);

router.post(
  '/verify-email-code',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { code }: { code: string } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.emailVerificationCode) {
      throw new AppError('No verification code requested', 400);
    }

    if (
      user.emailVerificationCode !== code ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      throw new AppError('Invalid or expired code', 400);
    }

    user.email_verified = true;

    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;

    await user.save();

    res.json({
      message: 'Email successfully verified',
    });
  }),
);

export default router;
