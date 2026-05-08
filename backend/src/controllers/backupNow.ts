import type { Request, Response } from 'express';

export async function backupNow(req: Request, res: Response) {
  try {
    const webhookUrl = process.env.MAKE_BACKUP_WEBHOOK_URL;

    if (!webhookUrl) {
      return res
        .status(400)
        .json({ error: 'MAKE_BACKUP_WEBHOOK_URL not configured' });
    }

    const backup = {
      timestamp: new Date().toISOString(),
      // MongoDB: тут обычно ты бы делал backup через collections
      // если у тебя уже есть модели — лучше заменить db.stores
      stores: null,
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      });
    } catch (err: any) {
      console.error('Backup webhook failed:', err.message);
    }

    res.json({
      success: true,
      message: 'Backup triggered',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
