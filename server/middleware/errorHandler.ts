import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../types/guidance.ts';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.errorCode,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  console.error('Unhandled Server Error:', err);
  return res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Unable to generate guidance right now.',
  });
}
