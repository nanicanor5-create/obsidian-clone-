/**
 * Error Handler Middleware
 * 
 * Centraliza o tratamento de erros da API
 */

import { Request, Response, NextFunction } from 'express'
import { logger } from '@/utils/logger'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR',
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: any[],
  ) {
    super(message, 400, 'VALIDATION_ERROR')
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = 'Too many requests',
    public retryAfter?: number,
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}

export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = req.id

  // Log error
  if (error instanceof AppError) {
    logger.warn(
      {
        requestId,
        statusCode: error.statusCode,
        code: error.code,
        path: req.path,
        method: req.method,
      },
      error.message,
    )
  } else {
    logger.error(
      {
        requestId,
        path: req.path,
        method: req.method,
        stack: error.stack,
      },
      error.message,
    )
  }

  // Send response
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
      code: error.code,
      ...(error instanceof ValidationError && { errors: error.errors }),
      ...(error instanceof RateLimitError && error.retryAfter && { retryAfter: error.retryAfter }),
      requestId,
    })
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      requestId,
      ...(process.env.NODE_ENV !== 'production' && { error: error.message }),
    })
  }
}

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
