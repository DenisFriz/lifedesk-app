import crypto from 'crypto';
import type { Response, CookieOptions } from 'express';
import { RefreshToken } from '@/models/RefreshToken.js';
import { createAccessToken, createRefreshToken } from '@/utils/token.utils.js';

export function getRefreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? ('none' as const) : ('lax' as const),
    path: '/',
  };
}

export async function issueAuthSession(userId: string, res: Response) {
  const accessToken = createAccessToken(userId);

  const { token: refreshToken } = createRefreshToken(userId);

  const refreshTokenHash = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  await RefreshToken.create({
    user_id: userId,
    token_hash: refreshTokenHash,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revoked: false,
  });

  res.cookie('refreshToken', refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return { accessToken };
}
