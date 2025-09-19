import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'ValidationError', details: err.flatten() });
  }

  const status = (err as any)?.status || 500;
  const message = (err as any)?.message || 'Internal Server Error';

  logger.error({ err }, 'Request failed');
  res.status(status).json({ error: message });
}
