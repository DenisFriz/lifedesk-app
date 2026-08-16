import { z } from 'zod';

export const twoFactorVerifySchema = z.object({
  token: z
    .string()
    .regex(/^\d{6}$/, 'Verification code must be a 6-digit number'),
});

export const changeEmailRequestSchema = z.object({
  newEmail: z.email({ error: 'Invalid email format' }),
});

export const confirmEmailChangeSchema = z.object({
  token: z.string().min(1, 'Confirmation token is required'),
});

export const verifyEmailTokenSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const disable2FASchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const generateRecoveryCodesSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .superRefine((password, ctx) => {
      if (!/[a-z]/.test(password)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Password must contain at least one lowercase letter',
        });
      }

      if (!/[A-Z]/.test(password)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Password must contain at least one uppercase letter',
        });
      }

      if (!/[0-9]/.test(password)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Password must contain at least one number',
        });
      }

      if (!/[^a-zA-Z0-9]/.test(password)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Password must contain at least one special character',
        });
      }
    }),
});
