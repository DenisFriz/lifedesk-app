import { z } from 'zod';

export const registerUserSchema = z.object({
  email: z.email({
    error: 'Invalid email format',
  }),
  password: z
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

  acceptedTerms: z.literal(true).refine((val) => val === true, {
    message: 'You must accept Terms of Service and Privacy Policy',
  }),
});

export const loginUserSchema = z.object({
  email: z.email({
    error: 'Invalid email format',
  }),

  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(10, 'Invalid Google credential format'),
});

export const forgotPasswordSchema = z.object({
  email: z.email({
    error: 'Invalid email format',
  }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),

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
