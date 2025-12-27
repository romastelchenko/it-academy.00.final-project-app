import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function RequestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existing = req.header('x-request-id');
  const requestId = existing && existing.length > 0 ? existing : uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
}
