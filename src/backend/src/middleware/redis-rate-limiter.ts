/**
 * Redis Rate Limiter - FitOS
 * 
 * Rate limiting distribuído usando Redis:
 * - Rate limiting global por IP
 * - Rate limiting por endpoint
 * - Rate limiting por tenant
 * - Rate limiting por usuário
 * - Sliding window rate limiting
 */

import { Request, Response, NextFunction } from 'express';
import { redisService } from '../services/redis.service';
import { generateRateLimitCacheKey } from '../utils/cache-utils';
import { logger } from '../utils/logger';

export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  max: number; // Máximo de requests
  keyGenerator?: (req: Request) => string; // Função para gerar chave
  skipSuccessfulRequests?: boolean; // Pular requests bem-sucedidos
  skipFailedRequests?: boolean; // Pular requests com falha
  message?: string; // Mensagem de erro
  standardHeaders?: boolean; // Headers padrão
  legacyHeaders?: boolean; // Headers legados
}

export interface RateLimitResult {
  limit: number;
  current: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export class RedisRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      ...config,
      windowMs: config.windowMs || 15 * 60 * 1000, // 15 minutos
      max: config.max || 100,
      message: config.message || 'Too many requests, please try again later.',
      standardHeaders: config.standardHeaders !== false,
      legacyHeaders: config.legacyHeaders || false
    };
  }

  /**
   * Middleware de rate limiting
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Bypass para SUPER_ADMIN
        const role = (req as any).user?.role;
        if (role === 'SUPER_ADMIN') {
          return next();
        }

        // Whitelist de rotas críticas (perfil, sidebar) para evitar UX ruim
        const path = req.path || '';
        if (path.startsWith('/api/settings/profile') || path.startsWith('/api/sidebar/config')) {
          return next();
        }

        const key = this.config.keyGenerator ? 
          this.config.keyGenerator(req) : 
          this.generateDefaultKey(req);

        const result = await this.checkLimit(key);

        // Adicionar headers de rate limit
        this.setHeaders(res, result);

        // Verificar se excedeu o limite
        if (result.current > result.limit) {
          const retryAfter = Math.ceil(result.resetTime.getTime() / 1000);
          
          res.status(429).json({
            success: false,
            error: {
              message: this.config.message,
              retryAfter,
              limit: result.limit,
              remaining: 0,
              resetTime: result.resetTime
            }
          });
          return;
        }

        // Continuar para o próximo middleware
        next();
      } catch (error) {
        logger.error('Rate limiter error:', error);
        // Em caso de erro, permitir a requisição
        next();
      }
    };
  }

  /**
   * Verificar limite de rate
   */
  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const window = Math.floor(now / this.config.windowMs);
    const windowKey = `${key}:${window}`;
    const resetTime = new Date((window + 1) * this.config.windowMs);

    // Incrementar contador
    const current = await redisService.incrWithTTL(
      windowKey,
      Math.ceil(this.config.windowMs / 1000)
    );

    return {
      limit: this.config.max,
      current,
      remaining: Math.max(0, this.config.max - current),
      resetTime
    };
  }

  /**
   * Gerar chave padrão baseada em IP
   */
  private generateDefaultKey(req: Request): string {
    const ip = this.getClientIP(req);
    return generateRateLimitCacheKey(ip, 'global');
  }

  /**
   * Obter IP do cliente
   */
  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Definir headers de rate limit
   */
  private setHeaders(res: Response, result: RateLimitResult): void {
    if (this.config.standardHeaders) {
      res.set({
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
      });
    }

    if (this.config.legacyHeaders) {
      res.set({
        'X-Rate-Limit-Limit': result.limit.toString(),
        'X-Rate-Limit-Remaining': result.remaining.toString(),
        'X-Rate-Limit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
      });
    }
  }
}

/**
 * Rate limiter global por IP
 */
export const globalRateLimiter = new RedisRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 requests por 15 minutos
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return generateRateLimitCacheKey(ip, 'global');
  }
});

/**
 * Rate limiter para endpoints de autenticação
 */
export const authRateLimiter = new RedisRateLimiter({
  windowMs: 2 * 60 * 1000, // 2 minutos
  max: 20, // 20 tentativas por 2 minutos
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return generateRateLimitCacheKey(ip, 'auth');
  },
  message: 'Too many authentication attempts, please try again later.'
});

/**
 * Rate limiter para endpoints de chat
 */
export const chatRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 mensagens por minuto
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return generateRateLimitCacheKey(userId, 'user');
  },
  message: 'Too many chat messages, please slow down.'
});

/**
 * Rate limiter por tenant
 */
export const tenantRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto por tenant
  keyGenerator: (req) => {
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'default';
    return generateRateLimitCacheKey(tenantId, 'tenant');
  }
});

/**
 * Rate limiter para uploads
 */
export const uploadRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 uploads por minuto
  keyGenerator: (req) => {
    const userId = (req as any).user?.id || 'anonymous';
    return generateRateLimitCacheKey(userId, 'user');
  },
  message: 'Too many uploads, please wait before uploading again.'
});

/**
 * Rate limiter para API externa
 */
export const apiRateLimiter = new RedisRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // 60 requests por minuto
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'] as string || 'no-key';
    return generateRateLimitCacheKey(apiKey, 'global');
  },
  message: 'API rate limit exceeded, please check your API key usage.'
});

/**
 * Rate limiter progressivo (aumenta o tempo de bloqueio)
 */
export class ProgressiveRateLimiter {
  private baseConfig: RateLimitConfig;
  private maxAttempts: number;

  constructor(baseConfig: RateLimitConfig, maxAttempts: number = 5) {
    this.baseConfig = baseConfig;
    this.maxAttempts = maxAttempts;
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.baseConfig.keyGenerator ? 
          this.baseConfig.keyGenerator(req) : 
          this.generateDefaultKey(req);

        // Verificar tentativas anteriores
        const attempts = await redisService.get<number>(`attempts:${key}`, {
          namespace: 'ratelimit'
        }) || 0;

        // Calcular janela de tempo progressiva
        const progressiveWindow = Math.min(
          this.baseConfig.windowMs * Math.pow(2, attempts),
          this.baseConfig.windowMs * 16 // Máximo 16x a janela base
        );

        const limiter = new RedisRateLimiter({
          ...this.baseConfig,
          windowMs: progressiveWindow
        });

        const result = await limiter.checkLimit(key);

        // Adicionar headers
        this.setHeaders(res, result);

        if (result.current > result.limit) {
          // Incrementar tentativas
          await redisService.incrWithTTL(
            `attempts:${key}`,
            3600, // 1 hora
            { namespace: 'ratelimit' }
          );

          const retryAfter = Math.ceil(result.resetTime.getTime() / 1000);
          
          res.status(429).json({
            success: false,
            error: {
              message: this.baseConfig.message,
              retryAfter,
              limit: result.limit,
              remaining: 0,
              resetTime: result.resetTime,
              attempts: attempts + 1
            }
          });
          return;
        }

        // Reset tentativas em caso de sucesso
        if (attempts > 0) {
          await redisService.del(`attempts:${key}`, {
            namespace: 'ratelimit'
          });
        }

        next();
      } catch (error) {
        logger.error('Progressive rate limiter error:', error);
        next();
      }
    };
  }

  private generateDefaultKey(req: Request): string {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return generateRateLimitCacheKey(ip, 'global');
  }

  private setHeaders(res: Response, result: RateLimitResult): void {
    res.set({
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
    });
  }
}

/**
 * Rate limiter progressivo para login
 */
export const progressiveAuthRateLimiter = new ProgressiveRateLimiter({
  windowMs: 2 * 60 * 1000, // 2 minutos base
  max: 5, // 5 tentativas por janela
  keyGenerator: (req) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    return generateRateLimitCacheKey(ip, 'auth');
  },
  message: 'Too many authentication attempts. Please wait before trying again.'
}, 5);

/**
 * Middleware para limpar rate limits em caso de sucesso
 */
export function clearRateLimitOnSuccess(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(data: any) {
    // Se a resposta foi bem-sucedida, limpar rate limits
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const key = req.ip || req.connection.remoteAddress || 'unknown';
      redisService.del(`attempts:${key}`, {
        namespace: 'ratelimit'
      }).catch(error => {
        logger.error('Error clearing rate limit:', error);
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}
