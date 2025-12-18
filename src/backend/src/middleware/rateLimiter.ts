/**
 * Rate Limiter Middleware - FitOS
 * 
 * Rate limiting distribuído usando Redis:
 * - Rate limiting global por IP
 * - Rate limiting para autenticação
 * - Rate limiting para chat
 * - Rate limiting por tenant
 * - Fallback para memória local quando Redis não disponível
 */

import { Request, Response } from 'express';
import { config } from '../config/config-simple';
import { logger } from '../utils/logger';
import {
  globalRateLimiter,
  authRateLimiter,
  chatRateLimiter,
  tenantRateLimiter,
  progressiveAuthRateLimiter,
  clearRateLimitOnSuccess
} from './redis-rate-limiter';
import { redisService } from '../services/redis.service';

// Verificar se Redis está disponível (lazy check)
let isRedisAvailable = false;
let redisCheckPromise: Promise<boolean> | null = null;

const checkRedisAvailability = async (): Promise<boolean> => {
  if (redisCheckPromise) {
    return redisCheckPromise;
  }

  redisCheckPromise = redisService.healthCheck()
    .then(health => {
      isRedisAvailable = health.status === 'healthy';
      logger.info(`Redis rate limiter ${isRedisAvailable ? 'enabled' : 'disabled'}`);
      return isRedisAvailable;
    })
    .catch(() => {
      isRedisAvailable = false;
      logger.warn('Redis not available, using memory-based rate limiting');
      return false;
    });

  return redisCheckPromise;
};

/**
 * Rate limiter global (fallback para memória local)
 */
const memoryRateLimiter = {
  store: new Map<string, { count: number; resetTime: number }>(),

  checkLimit(key: string, windowMs: number, max: number) {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const windowKey = `${key}:${window}`;
    const resetTime = (window + 1) * windowMs;

    const current = this.store.get(windowKey) || { count: 0, resetTime };
    current.count++;
    this.store.set(windowKey, current);

    // Limpar entradas expiradas
    for (const [k, v] of this.store.entries()) {
      if (v.resetTime < now) {
        this.store.delete(k);
      }
    }

    return {
      limit: max,
      current: current.count,
      remaining: Math.max(0, max - current.count),
      resetTime: new Date(resetTime)
    };
  }
};

/**
 * Middleware de rate limiting híbrido (Redis + memória)
 */
function createHybridRateLimiter(redisLimiter: any, windowMs: number, max: number) {
  return async (req: Request, res: Response, next: Function) => {
    try {
      // Pular rate limiting para rotas de autenticação, health check e webhooks
      if (
        req.url?.startsWith('/api/auth/') ||
        req.url?.startsWith('/api/health') ||
        req.url?.startsWith('/api/webhooks')
      ) {
        return next();
      }

      // Verificar se é SUPER_ADMIN pelo token JWT (antes da autenticação)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, config.jwt.secret);

          if (decoded.role === 'SUPER_ADMIN') {
            logger.debug('Rate limiting bypassed for SUPER_ADMIN (JWT)', {
              ip: req.ip,
              url: req.url,
              method: req.method,
              userRole: decoded.role
            });
            return next();
          }
        } catch (error) {
          // Token inválido, continuar com rate limiting normal
        }
      }

      // Pular rate limiting para SUPER_ADMIN (fallback com verificação melhorada)
      const userRole = (req as any).user?.role;
      const userId = (req as any).user?.id;

      if (userRole === 'SUPER_ADMIN') {
        logger.debug('Rate limiting bypassed for SUPER_ADMIN', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          userRole,
          userId
        });
        // Adicionar header indicando bypass para SUPER_ADMIN
        res.set({
          'X-RateLimit-Bypass': 'SUPER_ADMIN',
          'X-RateLimit-Limit': 'unlimited',
          'X-RateLimit-Remaining': 'unlimited'
        });
        return next();
      }

      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `ratelimit:${ip}`;

      let result;

      // Verificar disponibilidade do Redis de forma lazy
      const redisAvailable = await checkRedisAvailability();

      if (redisAvailable) {
        // Usar Redis
        result = await redisLimiter.checkLimit(key);
      } else {
        // Usar memória local
        result = memoryRateLimiter.checkLimit(key, windowMs, max);
      }

      // Adicionar headers
      res.set({
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
      });

      if (result.current > result.limit) {
        const retryAfter = Math.ceil(result.resetTime.getTime() / 1000);

        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          userAgent: req.get('User-Agent'),
          limit: result.limit,
          current: result.current
        });

        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests from this IP, please try again later.',
            retryAfter,
            limit: result.limit,
            remaining: 0,
            resetTime: result.resetTime
          }
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Rate limiter error:', error);
      next();
    }
  };
}

/**
 * Rate limiter global
 */
export const rateLimiter = createHybridRateLimiter(
  globalRateLimiter,
  config.rateLimit.windowMs,
  config.rateLimit.max
);

/**
 * Rate limiter para autenticação
 */
export const authRateLimiterMiddleware = createHybridRateLimiter(
  authRateLimiter,
  2 * 60 * 1000, // 2 minutos
  20 // 20 tentativas
);

/**
 * Rate limiter para chat
 */
export const chatRateLimiterMiddleware = createHybridRateLimiter(
  chatRateLimiter,
  60 * 1000, // 1 minuto
  30 // 30 mensagens
);

/**
 * Rate limiter por tenant
 */
export const tenantRateLimiterMiddleware = createHybridRateLimiter(
  tenantRateLimiter,
  60 * 1000, // 1 minuto
  100 // 100 requests por tenant
);

/**
 * Rate limiter progressivo para autenticação
 */
export const progressiveAuthRateLimiterMiddleware = progressiveAuthRateLimiter.middleware();

/**
 * Middleware para limpar rate limits em caso de sucesso
 */
export { clearRateLimitOnSuccess };

/**
 * Rate limiter customizado
 */
export const createCustomRateLimiter = (windowMs: number, max: number, message?: string) => {
  return createHybridRateLimiter(
    {
      checkLimit: async (key: string) => {
        const now = Date.now();
        const window = Math.floor(now / windowMs);
        const windowKey = `${key}:${window}`;
        const resetTime = new Date((window + 1) * windowMs);

        const current = await redisService.incrWithTTL(
          windowKey,
          Math.ceil(windowMs / 1000)
        );

        return {
          limit: max,
          current,
          remaining: Math.max(0, max - current),
          resetTime
        };
      }
    },
    windowMs,
    max
  );
};

/**
 * Rate limiter para uploads
 */
export const uploadRateLimiter = createCustomRateLimiter(
  60 * 1000, // 1 minuto
  10, // 10 uploads por minuto
  'Too many uploads, please wait before uploading again.'
);

/**
 * Rate limiter para API externa
 */
export const apiRateLimiter = createCustomRateLimiter(
  60 * 1000, // 1 minuto
  60, // 60 requests por minuto
  'API rate limit exceeded, please check your API key usage.'
);

/**
 * Rate limiter para webhooks
 */
export const webhookRateLimiter = createCustomRateLimiter(
  60 * 1000, // 1 minuto
  100, // 100 webhooks por minuto
  'Too many webhook requests, please slow down.'
);

/**
 * Middleware para aplicar rate limiting baseado em role
 */
export const roleBasedRateLimiter = (roleLimits: Record<string, { windowMs: number; max: number }>) => {
  return async (req: Request, res: Response, next: Function) => {
    try {
      // Whitelist de rotas críticas para UX
      const path = req.url || req.path || '';
      if (path.startsWith('/api/settings/profile') || path.startsWith('/api/sidebar/config')) {
        return next();
      }

      // Bypass por JWT (antes do auth middleware popular req.user)
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, config.jwt.secret);
          if (decoded.role === 'SUPER_ADMIN') {
            res.set({ 'X-RateLimit-Bypass': 'SUPER_ADMIN' });
            return next();
          }
        } catch (_) {
          // Ignorar erros de JWT e seguir com lógica padrão
        }
      }

      const userRole = (req as any).user?.role || 'CLIENT';

      // SUPER_ADMIN não tem nenhum limite de rate limiting
      if (userRole === 'SUPER_ADMIN') {
        logger.debug('Role-based rate limiting bypassed for SUPER_ADMIN', {
          ip: req.ip,
          url: req.url,
          method: req.method,
          userRole
        });
        res.set({ 'X-RateLimit-Bypass': 'SUPER_ADMIN' });
        return next();
      }

      const limits = roleLimits[userRole] || roleLimits['CLIENT'];

      if (!limits) {
        return next();
      }

      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const key = `ratelimit:role:${userRole}:${ip}`;

      let result;

      if (isRedisAvailable) {
        const now = Date.now();
        const window = Math.floor(now / limits.windowMs);
        const windowKey = `${key}:${window}`;
        const resetTime = new Date((window + 1) * limits.windowMs);

        const current = await redisService.incrWithTTL(
          windowKey,
          Math.ceil(limits.windowMs / 1000)
        );

        result = {
          limit: limits.max,
          current,
          remaining: Math.max(0, limits.max - current),
          resetTime
        };
      } else {
        result = memoryRateLimiter.checkLimit(key, limits.windowMs, limits.max);
      }

      // Adicionar headers
      res.set({
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
      });

      if (result.current > result.limit) {
        const retryAfter = Math.ceil(result.resetTime.getTime() / 1000);

        logger.warn('Role-based rate limit exceeded', {
          ip: req.ip,
          role: userRole,
          url: req.url,
          method: req.method,
          limit: result.limit,
          current: result.current
        });

        res.status(429).json({
          success: false,
          error: {
            message: `Rate limit exceeded for role ${userRole}. Please try again later.`,
            retryAfter,
            limit: result.limit,
            remaining: 0,
            resetTime: result.resetTime
          }
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Role-based rate limiter error:', error);
      next();
    }
  };
};

/**
 * Configuração de rate limits por role
 * SUPER_ADMIN não tem limites - bypass completo
 */
export const roleLimits = {
  OWNER: { windowMs: 60 * 1000, max: 500 }, // 500 req/min
  ADMIN: { windowMs: 60 * 1000, max: 300 }, // 300 req/min
  TRAINER: { windowMs: 60 * 1000, max: 200 }, // 200 req/min
  CLIENT: { windowMs: 60 * 1000, max: 100 } // 100 req/min
};

/**
 * Rate limiter baseado em role
 */
export const roleBasedRateLimiterMiddleware = roleBasedRateLimiter(roleLimits);

/**
 * Middleware para pular rate limiting em condições específicas
 */
export const skipRateLimit = (conditions: {
  healthCheck?: boolean;
  aiManagement?: boolean;
  superAdmin?: boolean;
  custom?: (req: Request) => boolean;
}) => {
  return (req: Request) => {
    // Skip rate limiting if disabled in dev
    if (config.rateLimit.disabled) {
      return true;
    }

    // Health check
    if (conditions.healthCheck && req.url === '/api/health') {
      return true;
    }

    // AI management routes
    if (conditions.aiManagement && (
      req.url.startsWith('/api/super-admin/ai-') ||
      req.url.startsWith('/api/webhooks/ai-')
    )) {
      return true;
    }

    // SUPER_ADMIN
    if (conditions.superAdmin && req.headers['x-user-role'] === 'SUPER_ADMIN') {
      return true;
    }

    // Custom condition
    if (conditions.custom && conditions.custom(req)) {
      return true;
    }

    return false;
  };
};

/**
 * Estatísticas de rate limiting
 */
export const getRateLimitStats = async () => {
  if (!isRedisAvailable) {
    return {
      redisAvailable: false,
      memoryStoreSize: memoryRateLimiter.store.size,
      message: 'Using memory-based rate limiting'
    };
  }

  try {
    const stats = await redisService.getStats();
    const health = await redisService.healthCheck();

    return {
      redisAvailable: true,
      redisHealth: health,
      cacheStats: stats,
      message: 'Using Redis-based rate limiting'
    };
  } catch (error) {
    return {
      redisAvailable: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Redis error, falling back to memory-based rate limiting'
    };
  }
};