import type { Request, Response } from 'express';
import { User } from '@/models/index.js';

type AdminClearDeletedFieldsBody = {
  userId: string;
};

export async function adminClearDeletedFields(
  req: Request<{}, {}, AdminClearDeletedFieldsBody>,
  res: Response,
) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const updated = await User.findOneAndUpdate(
      { id: userId },
      {
        $set: {
          is_deleted: false,
          deleted_at: null,
        },
      },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = updated.toObject();
    delete (user as any).passwordHash;
    delete (user as any).plaid_connections;

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
