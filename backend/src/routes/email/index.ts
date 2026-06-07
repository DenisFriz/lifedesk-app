import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User } from '@models/index.js';
import { requireAuth } from '@middleware/auth.js';
import { Resend } from 'resend';

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

let verificationEmailTemplate: string | null = null;

function getVerificationEmailTemplate(code: string, name: string) {
  if (!verificationEmailTemplate) {
    const filePath = path.join(
      process.cwd(),
      'src/templates/email-verification.html',
    );
    verificationEmailTemplate = fs.readFileSync(filePath, 'utf-8');
  }

  let html = verificationEmailTemplate;
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
