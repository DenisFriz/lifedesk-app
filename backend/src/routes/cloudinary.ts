import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { cloudinary } from '@/lib/cloudinary.js';

const router = Router();

const ALLOWED_FOLDERS = ['uploads', 'temp'] as const;

const apiSecret = process.env.CLOUDINARY_API_SECRET;
const apiKey = process.env.CLOUDINARY_API_KEY;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

router.post('/signature', async (req: Request, res: Response) => {
  try {
    if (!apiSecret || !apiKey || !cloudName) {
      return res
        .status(500)
        .json({ message: 'Cloudinary env vars not configured' });
    }

    const rawFolder = req.body?.folder ?? 'uploads';
    if (
      !ALLOWED_FOLDERS.includes(rawFolder as (typeof ALLOWED_FOLDERS)[number])
    ) {
      return res.status(400).json({
        message: `Invalid folder. Allowed: ${ALLOWED_FOLDERS.join(', ')}`,
      });
    }
    const folder = rawFolder;

    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    return res.json({
      timestamp,
      signature,
      api_key: apiKey,
      cloud_name: cloudName,
      folder,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
});

router.delete('/image', async (req: Request, res: Response) => {
  try {
    if (!apiSecret || !apiKey || !cloudName) {
      return res
        .status(500)
        .json({ message: 'Cloudinary env vars not configured' });
    }

    const { public_id } = req.body;

    if (!public_id || typeof public_id !== 'string') {
      return res.status(400).json({ message: 'Missing or invalid public_id' });
    }

    if (!ALLOWED_FOLDERS.some((f) => public_id.startsWith(f + '/'))) {
      return res.status(400).json({
        message: `Invalid public_id. Must start with ${ALLOWED_FOLDERS.map((f) => `${f}/`).join(' or ')}`,
      });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `public_id=${public_id}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + apiSecret)
      .digest('hex');

    const destroyUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`;
    const destroyParams = new URLSearchParams({
      public_id,
      signature,
      api_key: apiKey,
      timestamp: String(timestamp),
    });

    const response = await fetch(destroyUrl, {
      method: 'POST',
      body: destroyParams,
    });

    if (!response.ok) {
      const error: any = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        message:
          error?.error?.message ?? 'Failed to delete image from Cloudinary',
      });
    }

    return res.json({ message: 'Image deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
});

router.post('/move', async (req: Request, res: Response) => {
  try {
    if (!apiSecret || !apiKey || !cloudName) {
      return res
        .status(500)
        .json({ message: 'Cloudinary env vars not configured' });
    }

    const { public_ids } = req.body;

    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return res
        .status(400)
        .json({ message: 'public_ids must be a non-empty array' });
    }

    if (
      !public_ids.every(
        (id) => typeof id === 'string' && id.startsWith('temp/'),
      )
    ) {
      return res
        .status(400)
        .json({ message: 'All public_ids must start with temp/' });
    }

    const moved = [];

    for (const from_public_id of public_ids) {
      const to_public_id = from_public_id.replace(/^temp\//, 'uploads/');

      try {
        const result: any = await cloudinary.uploader.rename(
          from_public_id,
          to_public_id,
          { overwrite: true, invalidate: true },
        );
        moved.push({
          old_public_id: from_public_id,
          new_public_id: to_public_id,
          new_url: result.secure_url,
        });
      } catch (err: any) {
        return res.status(400).json({
          message: err.message ?? `Failed to move image ${from_public_id}`,
        });
      }
    }

    return res.json({ moved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({ error: message });
  }
});

export default router;
