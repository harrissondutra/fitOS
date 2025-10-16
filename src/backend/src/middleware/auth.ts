import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { RequestWithTenant } from './tenant';

export interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

export const authMiddleware = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Authorization header missing or invalid',
        },
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Token not provided',
        },
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Check if user exists and is active
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
        lastLogin: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
        },
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(401).json({
        success: false,
        error: {
          message: 'User account is not active',
        },
      });
      return;
    }

    // Verify tenant matches
    if (user.tenantId !== decoded.tenantId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Token tenant mismatch',
        },
      });
      return;
    }

    // Verify tenant is active
    if (req.tenant && req.tenant.id !== decoded.tenantId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Request tenant mismatch',
        },
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    // Add user ID to response headers
    res.set('X-User-ID', user.id);

    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token:', error.message);
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
        },
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token');
      res.status(401).json({
        success: false,
        error: {
          message: 'Token expired',
        },
      });
      return;
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    });
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: RequestWithAuth, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated',
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });

      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
};

// Admin only middleware
export const requireAdmin = requireRole(['OWNER', 'ADMIN']);

// Trainer or admin middleware
export const requireTrainer = requireRole(['OWNER', 'ADMIN', 'TRAINER']);

// Owner only middleware
export const requireOwner = requireRole(['OWNER']);

// Optional auth middleware (doesn't fail if no token)
export const optionalAuth = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Check if user exists and is active
    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        tenantId: true,
      },
    });

    if (user && user.status === 'ACTIVE' && user.tenantId === decoded.tenantId) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      };
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on token errors
    logger.debug('Optional auth failed:', error);
    next();
  }
};
