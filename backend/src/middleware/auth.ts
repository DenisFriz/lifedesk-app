import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '@/models/User.js';
import { IUser } from '@/types/index.js';

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: string;
    };
    const user = await User.findOne({ id: userId });
    if (!user || user.is_deleted) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.user = user.toJSON() as IUser;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
