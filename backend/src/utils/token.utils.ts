import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '30d';

export interface AccessTokenPayload {
  userId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export function createAccessToken(userId: string) {
  const payload: AccessTokenPayload = { userId };

  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

export function createRefreshToken(userId: string) {
  const token = jwt.sign({ userId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });

  return { token };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}
