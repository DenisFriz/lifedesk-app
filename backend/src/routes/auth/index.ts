import { Router, type Request, type Response } from 'express';

import { LoginDTO, RegisterDTO } from './types.js';
import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User } from '@models/index.js';
import { comparePassword, hashPassword } from '@lib/bcrypt.js';
import { createToken } from '@utils/createToken.js';
import { sanitizeUser } from '@utils/sanitizeUser.js';
import { requireAuth } from '@middleware/auth.js';
import { AuthenticatedRequest } from '@/@types/auth.js';

import { Resend } from 'resend';

import fs from 'fs';
import path from 'path';

function getResetPasswordTemplate(resetLink: string, name: string) {
  const filePath = path.join(
    process.cwd(),
    'src/templates/reset-password.html',
  );

  let html = fs.readFileSync(filePath, 'utf-8');

  html = html.replaceAll('{{RESET_LINK}}', resetLink);
  html = html.replaceAll('{{NAME}}', name);

  return html;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const router = Router();

// REGISTER
router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, acceptedTerms } = req.body as RegisterDTO;

    if (!acceptedTerms) {
      throw new AppError(
        'You must accept Terms of Service and Privacy Policy',
        400,
      );
    }

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const existing = await User.findOne({ email });

    if (existing) {
      throw new AppError('User already exists', 400);
    }

    const passwordHash = await hashPassword(password);

    const user = new User({
      email,
      passwordHash,
      terms_accepted_at: new Date().toISOString(),
      terms_accepted_version: '1.0',
    });

    await user.save();

    const token = createToken(user.id);

    const userResponse = sanitizeUser(user);

    res.json({ token, user: userResponse });
  }),
);

// LOGIN
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginDTO;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const user = await User.findOne({ email });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const valid = await comparePassword(password, user.passwordHash);

    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = createToken(user.id);

    const userResponse = sanitizeUser(user);

    res.json({ token, user: userResponse });
  }),
);

// ME
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userResponse = sanitizeUser(req.user);

    res.json(userResponse);
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
    ];

    const updateData: Record<string, any> = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const updated = await User.findOneAndUpdate(
      { id: req.user.id },
      {
        $set: {
          ...updateData,
          updated_at: new Date().toISOString(),
        },
      },
      { new: true },
    );

    if (!updated) {
      throw new AppError('User not found', 404);
    }

    const userResponse = sanitizeUser(updated);

    res.json(userResponse);
  }),
);

// FORGOT PASSWORD
router.post(
  '/forgot-password',
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    if (!email) {
      throw new AppError('Email is required', 400);
    }

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
  asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body as {
      token: string;
      newPassword: string;
    };

    if (!token || !newPassword) {
      throw new AppError('Token and new password are required', 400);
    }

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
