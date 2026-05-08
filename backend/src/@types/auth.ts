import type { Request } from 'express';
import { IUser } from '../types/index.js';

export type AuthenticatedRequest = Request & {
  user: IUser;
};
