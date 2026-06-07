import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User.js';
import { IUser } from '@/types/index.js';
import { verifyAccessToken } from '@/utils/token.utils.js';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '')
    : null;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    const user = await User.findById(payload.userId).lean();

    if (!user || user.is_deleted) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = user as IUser;

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
