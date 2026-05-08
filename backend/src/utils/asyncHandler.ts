import type { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncFn<TReq = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncHandler =
  <TReq = Request>(fn: AsyncFn<TReq>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as any, res, next)).catch(next);
  };
