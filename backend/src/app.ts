import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';

import authRouter from '@routes/auth/index.js';
import userRouter from '@routes/user/index.js';
import emailRouter from '@routes/email/index.js';
import entitiesRouter from '@routes/entities.js';
import functionsRouter from '@routes/functions.js';
import cloudinaryRouter from '@routes/cloudinary.js';
import { AppError } from '@errors/AppError.js';
import { requireAuth } from '@middleware/auth.js';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

app.use('/functions/stripeWebhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser());

app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/email', emailRouter);
app.use('/entities', requireAuth, entitiesRouter);
app.use('/cloudinary', requireAuth, cloudinaryRouter);
app.use('/functions', functionsRouter);

app.use((err: unknown, req: Request, res: Response) => {
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
