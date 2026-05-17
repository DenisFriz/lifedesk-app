import type { Request, Response } from 'express';

const MAX_STORAGE = 1024 * 1024 * 1024;
const MAX_IMAGES = 500;

type ValidateStorageUploadBody = {
  fileSize: number;
};

export function validateStorageUpload(
  req: Request<object, object, ValidateStorageUploadBody>,
  res: Response,
) {
  try {
    const { fileSize } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
      return res.status(400).json({ error: 'Invalid file size' });
    }

    const currentStorage = req.user.storage_used || 0;
    const currentImages = req.user.image_count || 0;

    if (currentStorage + fileSize > MAX_STORAGE) {
      const storageUsedGB = (currentStorage / (1024 * 1024 * 1024)).toFixed(2);
      const maxStorageGB = (MAX_STORAGE / (1024 * 1024 * 1024)).toFixed(2);
      return res.status(400).json({
        allowed: false,
        reason: 'storage_limit_exceeded',
        message: `Storage limit exceeded. Used: ${storageUsedGB}GB / ${maxStorageGB}GB`,
      });
    }

    if (currentImages >= MAX_IMAGES) {
      return res.status(400).json({
        allowed: false,
        reason: 'image_limit_exceeded',
        message: `Image limit exceeded. Maximum: ${MAX_IMAGES} images`,
      });
    }

    const storagePercent = ((currentStorage + fileSize) / MAX_STORAGE) * 100;
    const imagePercent = ((currentImages + 1) / MAX_IMAGES) * 100;

    res.json({
      allowed: true,
      storagePercent,
      imagePercent,
      currentStorage: currentStorage + fileSize,
      currentImages: currentImages + 1,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
