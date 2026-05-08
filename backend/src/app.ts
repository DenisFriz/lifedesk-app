import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';

import authRouter from '@routes/auth/index.js';
import entitiesRouter from '@routes/entities.js';
import functionsRouter from '@routes/functions.js';
import { AppError } from '@errors/AppError.js';
import { requireAuth } from '@middleware/auth.js';

const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, './uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
);

app.use('/functions/stripeWebhook', express.raw({ type: 'application/json' }));

app.use(express.json());

app.use('/uploads', express.static(uploadDir));

app.use('/auth', authRouter);
app.use('/entities', requireAuth, entitiesRouter);
app.use('/functions', functionsRouter);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  const isAppError = (err: any): err is AppError => {
    return err?.status && err instanceof Error;
  };

  if (isAppError(err)) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  const error = err instanceof Error ? err : new Error('Unknown error');

  res.status(500).json({
    message: error.message,
  });
});

export default app;
