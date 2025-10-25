/**
 * Cache Middleware - FitOS
 * 
 * Middleware Express para cache automático de rotas:
 * - Cache automático de responses GET
 * - Cache-Control headers
 * - Invalidação por método (POST/PUT/DELETE)
 * - Bypass para SUPER_ADMIN
 * - ETags para validação
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { redisService } from '../services/redis.service';
import { logger } from '../utils/logger';

export interface CacheMiddlewareOptions {
  ttl?: number; // TTL em segundos
  keyGenerator?: (req: Request) => string; // Função para gerar chave customizada
  skipCache?: (req: Request) => boolean; // Função para pular cache
  varyBy?: string[]; // Headers que afetam o cache
  etag?: boolean; // Se deve usar ETags
}

/**
 * Middleware de cache para rotas GET
 */
export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const {
    ttl = parseInt(process.env.REDIS_CACHE_TTL_DEFAULT || '1800', 10), // 30 minutos
    keyGenerator = defaultKeyGenerator,
    skipCache = defaultSkipCache,
    varyBy = ['authorization'],
    etag = true
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Só cachear requests GET
    if (req.method !== 'GET') {
      return next();
    }

    // Verificar se deve pular cache
    if (skipCache(req)) {
      return next();
    }

    try {
      // Gerar chave de cache
      const cacheKey = keyGenerator(req);
      
      // Verificar se tem ETag no request
      const clientETag = req.headers['if-none-match'];
      
      // Buscar no cache
      const cachedData = await redisService.get(cacheKey, {
        namespace: 'route-cache',
        ttl
      });

      if (cachedData) {
        const { data, etag: cachedETag, headers } = cachedData;
        
        // Verificar ETag
        if (etag && clientETag && clientETag === cachedETag) {
          res.status(304).end();
          return;
        }

        // Retornar dados do cache
        if (etag && cachedETag) {
          res.set('ETag', cachedETag);
        }
        
        // Aplicar headers do cache
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            res.set(key, value as string);
          });
        }

        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', cacheKey);
        
        logger.debug(`Cache HIT for key: ${cacheKey}`);
        return res.json(data);
      }

      // Cache miss - interceptar response
      const originalJson = res.json;
      const originalSend = res.send;
      const originalEnd = res.end;

      let responseData: any;
      const responseHeaders: Record<string, string> = {};

      // Interceptar res.json
      res.json = function(data: any) {
        responseData = data;
        return originalJson.call(this, data);
      };

      // Interceptar res.send
      res.send = function(data: any) {
        responseData = data;
        return originalSend.call(this, data);
      };

      // Interceptar res.end
      res.end = function(data?: any, encoding?: any) {
        if (data) {
          responseData = data;
        }
        
        // Salvar no cache após response
        if (responseData && res.statusCode === 200) {
          saveToCache(cacheKey, responseData, responseHeaders, etag, ttl);
        }
        
        return originalEnd.call(this, data, encoding);
      };

      // Interceptar res.set para capturar headers
      const originalSet = res.set;
      res.set = function(field: string, value?: string) {
        if (value !== undefined) {
          responseHeaders[field] = value;
        }
        return originalSet.call(this, field, value);
      };

      res.set('X-Cache', 'MISS');
      res.set('X-Cache-Key', cacheKey);
      
      logger.debug(`Cache MISS for key: ${cacheKey}`);
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Middleware para invalidar cache em mudanças
 */
export function cacheInvalidationMiddleware(options: {
  patterns?: string[]; // Padrões de chaves para invalidar
  keyGenerator?: (req: Request) => string[]; // Função para gerar chaves
} = {}) {
  const { patterns = [], keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Só invalidar em métodos que modificam dados
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    try {
      const keysToInvalidate: string[] = [];

      // Adicionar padrões fixos
      keysToInvalidate.push(...patterns);

      // Adicionar chaves geradas dinamicamente
      if (keyGenerator) {
        keysToInvalidate.push(...keyGenerator(req));
      }

      // Invalidar chaves
      for (const pattern of keysToInvalidate) {
        const invalidated = await redisService.invalidatePattern(pattern, {
          namespace: 'route-cache'
        });
        
        if (invalidated > 0) {
          logger.debug(`Invalidated ${invalidated} keys for pattern: ${pattern}`);
        }
      }

      // Invalidar cache de tenant se aplicável
      const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
      if (tenantId) {
        await redisService.invalidateTenant(tenantId, 'route-cache');
        logger.debug(`Invalidated tenant cache for: ${tenantId}`);
      }

      next();
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      next();
    }
  };
}

/**
 * Gerador de chave padrão
 */
function defaultKeyGenerator(req: Request): string {
  const { url, method, query } = req;
  const tenantId = (req as any).tenantId || (req as any).user?.tenantId || 'default';
  
  // Incluir query params na chave
  const queryString = Object.keys(query).length > 0 
    ? `?${new URLSearchParams(query as any).toString()}`
    : '';
  
  const fullUrl = `${method}:${url}${queryString}`;
  const hash = crypto.createHash('md5').update(fullUrl).digest('hex');
  
  return `${tenantId}:${hash}`;
}

/**
 * Função padrão para pular cache
 */
function defaultSkipCache(req: Request): boolean {
  // Pular cache para SUPER_ADMIN
  const userRole = (req as any).user?.role;
  if (userRole === 'SUPER_ADMIN') {
    return true;
  }

  // Pular cache se tiver header no-cache
  if (req.headers['cache-control']?.includes('no-cache')) {
    return true;
  }

  // Pular cache para rotas de debug
  if (req.url.includes('/debug') || req.url.includes('/admin/redis-monitor')) {
    return true;
  }

  return false;
}

/**
 * Salvar dados no cache
 */
async function saveToCache(
  key: string, 
  data: any, 
  headers: Record<string, string>, 
  useETag: boolean, 
  ttl: number
): Promise<void> {
  try {
    const cacheData: any = {
      data,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Gerar ETag se necessário
    if (useETag) {
      const etag = generateETag(data);
      cacheData.etag = etag;
    }

    await redisService.set(key, cacheData, {
      namespace: 'route-cache',
      ttl
    });

    logger.debug(`Cached response for key: ${key}`);
  } catch (error) {
    logger.error('Error saving to cache:', error);
  }
}

/**
 * Gerar ETag para dados
 */
function generateETag(data: any): string {
  const content = JSON.stringify(data);
  return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

/**
 * Middleware para adicionar headers de cache
 */
export function cacheHeadersMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Adicionar headers de cache para requests GET
    if (req.method === 'GET') {
      res.set('Cache-Control', 'private, max-age=300'); // 5 minutos
      res.set('Vary', 'Authorization, X-Tenant-ID');
    }
    
    next();
  };
}

/**
 * Middleware para limpar cache de rotas específicas
 */
export function clearRouteCache(patterns: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const pattern of patterns) {
        await redisService.invalidatePattern(pattern, {
          namespace: 'route-cache'
        });
      }
      
      logger.info(`Cleared cache for patterns: ${patterns.join(', ')}`);
      next();
    } catch (error) {
      logger.error('Error clearing route cache:', error);
      next();
    }
  };
}
