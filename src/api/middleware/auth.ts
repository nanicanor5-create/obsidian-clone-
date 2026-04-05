/**
 * Authentication Middleware
 * 
 * Verifica JWT token nas requisições protegidas
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from './errorHandler'

interface DecodedToken {
  id: string
  email: string
  iat: number
  exp: number
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header')
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, secret) as DecodedToken
    req.user = decoded

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token expired')
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token')
    }
    throw error
  }
}

export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const secret = process.env.JWT_SECRET

      if (secret) {
        const decoded = jwt.verify(token, secret) as DecodedToken
        req.user = decoded
      }
    }

    next()
  } catch (error) {
    // Ignore auth errors in optional middleware
    next()
  }
}

export function generateToken(data: { id: string; email: string }): string {
  const secret = process.env.JWT_SECRET
  const expiration = process.env.JWT_EXPIRATION || '7d'

  if (!secret) {
    throw new Error('JWT_SECRET not configured')
  }

  return jwt.sign(data, secret, { expiresIn: expiration })
}

export function verifyToken(token: string): DecodedToken | null {
  try {
    const secret = process.env.JWT_SECRET

    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    return jwt.verify(token, secret) as DecodedToken
  } catch {
    return null
  }
}
