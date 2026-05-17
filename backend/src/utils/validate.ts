import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

export const validate =
  (schema: z.ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json(result.error.format());
    }

    req.body = result.data;
    next();
  };
