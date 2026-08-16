import { Router, type Request, type Response } from 'express';
import { asyncHandler } from '@utils/asyncHandler.js';
import { AppError } from '@errors/AppError.js';
import { User } from '@models/index.js';
import { requireAuth } from '@middleware/auth.js';
import {
  createEmailVerificationToken,
  getEmailVerificationExpires,
  enqueueEmailVerificationEmail,
  enqueueRegistrationCompletedEmail,
} from '@/utils/emailVerification.js';
import { validate } from '@/utils/validate.js';
import { verifyEmailTokenSchema } from '@/schemas/user.schema.js';

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

    const token = createEmailVerificationToken();

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerificationCode: token,
          emailVerificationExpires: getEmailVerificationExpires(),
        },
      },
    );

    await enqueueEmailVerificationEmail(
      user.email,
      user.full_name || 'there',
      token,
    );

    res.json({
      message: 'Verification email sent',
    });
  }),
);

router.post(
  '/verify-email',
  validate(verifyEmailTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token }: { token: string } = req.body;

    const user = await User.findOne({
      emailVerificationCode: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification link', 400);
    }

    if (user.email_verified) {
      throw new AppError('Email already verified', 400);
    }

    user.email_verified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;

    await user.save();

    await enqueueRegistrationCompletedEmail(
      user.email,
      user.full_name || 'there',
    );

    res.json({
      message: 'Email successfully verified',
    });
  }),
);

export default router;
