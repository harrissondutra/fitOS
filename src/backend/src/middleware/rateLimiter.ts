import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later.',
      },
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.url === '/api/health';
  },
});

// Stricter rate limiting for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 20, // 20 attempts per window
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      url: req.url,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later.',
      },
    });
  },
});

// Rate limiting for chat endpoints
export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: {
    success: false,
    error: {
      message: 'Too many chat messages, please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
