import { z } from 'zod';

export const twoFactorVerifySchema = z.object({
  token: z
    .string()
    .regex(/^\d{6}$/, 'Verification code must be a 6-digit number'),
});
