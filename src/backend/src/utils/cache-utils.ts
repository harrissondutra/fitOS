/**
 * Cache Utilities - FitOS
 * 
 * Funções auxiliares para operações de cache:
 * - generateCacheKey() - Geração consistente de chaves
 * - parseCacheTTL() - Parse de TTLs (5m, 1h, 1d)
 * - shouldCache() - Lógica de decisão de cache
 * - invalidatePattern() - Invalidação por wildcard
 */

import crypto from 'crypto';

export interface CacheKeyOptions {
  tenantId?: string;
  userId?: string;
  namespace?: string;
  includeQuery?: boolean;
  includeHeaders?: string[];
}

/**
 * Gera chave de cache consistente
 */
export function generateCacheKey(
  baseKey: string, 
  options: CacheKeyOptions = {}
): string {
  const {
    tenantId,
    userId,
    namespace,
    includeQuery = false,
    includeHeaders = []
  } = options;

  let key = baseKey;

  // Adicionar namespace
  if (namespace) {
    key = `${namespace}:${key}`;
  }

  // Adicionar tenant
  if (tenantId) {
    key = `tenant:${tenantId}:${key}`;
  }

  // Adicionar usuário se especificado
  if (userId) {
    key = `user:${userId}:${key}`;
  }

  return key;
}

/**
 * Gera chave de cache com hash de parâmetros
 */
export function generateCacheKeyWithHash(
  baseKey: string,
  params: Record<string, any>,
  options: CacheKeyOptions = {}
): string {
  // Criar hash dos parâmetros
  const paramsString = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  const hash = crypto.createHash('md5').update(paramsString).digest('hex');
  
  return generateCacheKey(`${baseKey}:${hash}`, options);
}

/**
 * Parse de TTL de string para segundos
 */
export function parseCacheTTL(ttlString: string): number {
  const ttl = ttlString.toLowerCase().trim();
  
  // Números simples são segundos
  if (/^\d+$/.test(ttl)) {
    return parseInt(ttl, 10);
  }
  
  // Parse de formato com unidade (5m, 1h, 1d)
  const match = ttl.match(/^(\d+)([smhd])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    
    const multipliers: Record<string, number> = {
      's': 1,
      'm': 60,
      'h': 3600,
      'd': 86400
    };
    
    return value * (multipliers[unit] || 1);
  }
  
  // Fallback para 30 minutos
  return 1800;
}

/**
 * Verifica se deve cachear baseado em condições
 */
export function shouldCache(
  key: string,
  options: {
    userRole?: string;
    isPublic?: boolean;
    skipPatterns?: RegExp[];
    includePatterns?: RegExp[];
  } = {}
): boolean {
  const {
    userRole,
    isPublic = false,
    skipPatterns = [],
    includePatterns = []
  } = options;

  // Não cachear para SUPER_ADMIN em modo debug
  if (userRole === 'SUPER_ADMIN' && process.env.NODE_ENV === 'development') {
    return false;
  }

  // Verificar padrões de skip
  for (const pattern of skipPatterns) {
    if (pattern.test(key)) {
      return false;
    }
  }

  // Se tem padrões de include, verificar se algum bate
  if (includePatterns.length > 0) {
    const matchesInclude = includePatterns.some(pattern => pattern.test(key));
    if (!matchesInclude) {
      return false;
    }
  }

  // Cachear dados públicos ou usuários autenticados
  return isPublic || !!userRole;
}

/**
 * Gera padrão de invalidação
 */
export function generateInvalidationPattern(
  basePattern: string,
  options: {
    tenantId?: string;
    namespace?: string;
    wildcard?: boolean;
  } = {}
): string {
  const { tenantId, namespace, wildcard = true } = options;
  
  let pattern = basePattern;
  
  // Adicionar namespace
  if (namespace) {
    pattern = `${namespace}:${pattern}`;
  }
  
  // Adicionar tenant
  if (tenantId) {
    pattern = `tenant:${tenantId}:${pattern}`;
  }
  
  // Adicionar wildcard se necessário
  if (wildcard && !pattern.endsWith('*')) {
    pattern += '*';
  }
  
  return pattern;
}

/**
 * Extrai tenant ID de uma chave de cache
 */
export function extractTenantFromKey(key: string): string | null {
  const match = key.match(/^[^:]*:tenant:([^:]+):/);
  return match ? match[1] : null;
}

/**
 * Extrai namespace de uma chave de cache
 */
export function extractNamespaceFromKey(key: string): string | null {
  const parts = key.split(':');
  return parts.length > 1 ? parts[1] : null;
}

/**
 * Valida formato de chave de cache
 */
export function isValidCacheKey(key: string): boolean {
  // Chave não pode ser vazia
  if (!key || key.trim().length === 0) {
    return false;
  }
  
  // Chave não pode ter caracteres especiais perigosos
  if (/[<>:"|?*]/.test(key)) {
    return false;
  }
  
  // Chave não pode ser muito longa (limite Redis)
  if (key.length > 250) {
    return false;
  }
  
  return true;
}

/**
 * Normaliza chave de cache
 */
export function normalizeCacheKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Gera chave de cache para analytics
 */
export function generateAnalyticsCacheKey(
  type: 'tenant' | 'trainer' | 'member' | 'global',
  id: string,
  period: string,
  tenantId?: string
): string {
  const baseKey = `analytics:${type}:${id}:period:${period}`;
  return generateCacheKey(baseKey, { tenantId });
}

/**
 * Gera chave de cache para exercícios
 */
export function generateExerciseCacheKey(
  exerciseId: string,
  tenantId?: string
): string {
  return generateCacheKey(`exercise:${exerciseId}`, { tenantId });
}

/**
 * Gera chave de cache para listas de exercícios
 */
export function generateExerciseListCacheKey(
  filters: Record<string, any>,
  tenantId?: string
): string {
  return generateCacheKeyWithHash('exercises:list', filters, { tenantId });
}

/**
 * Gera chave de cache para workouts
 */
export function generateWorkoutCacheKey(
  workoutId: string,
  tenantId?: string
): string {
  return generateCacheKey(`workout:${workoutId}`, { tenantId });
}

/**
 * Gera chave de cache para listas de workouts
 */
export function generateWorkoutListCacheKey(
  clientId: string,
  page: number,
  tenantId?: string
): string {
  return generateCacheKey(`workouts:client:${clientId}:page:${page}`, { tenantId });
}

/**
 * Gera chave de cache para marketplace
 */
export function generateMarketplaceCacheKey(
  category: string,
  page: number,
  tenantId?: string
): string {
  return generateCacheKey(`marketplace:listings:${category}:page:${page}`, { tenantId });
}

/**
 * Gera chave de cache para sessão
 */
export function generateSessionCacheKey(
  userId: string,
  sessionId: string
): string {
  return generateCacheKey(`session:${sessionId}`, { userId });
}

/**
 * Gera chave de cache para rate limiting
 */
export function generateRateLimitCacheKey(
  identifier: string,
  type: 'global' | 'auth' | 'tenant' | 'user'
): string {
  return generateCacheKey(`ratelimit:${type}:${identifier}`);
}

/**
 * Gera chave de cache para presence
 */
export function generatePresenceCacheKey(
  userId: string,
  type: 'user' | 'last' | 'status'
): string {
  return generateCacheKey(`presence:${type}:${userId}`);
}

/**
 * Gera chave de cache para feature flags
 */
export function generateFeatureFlagCacheKey(
  featureName: string,
  tenantId?: string
): string {
  return generateCacheKey(`feature:${featureName}`, { tenantId });
}

/**
 * Gera chave de cache para leaderboard
 */
export function generateLeaderboardCacheKey(
  type: string,
  period: string,
  tenantId?: string
): string {
  return generateCacheKey(`leaderboard:${type}:${period}`, { tenantId });
}

/**
 * Calcula TTL baseado na frequência de mudança
 */
export function calculateTTL(
  dataType: 'analytics' | 'catalog' | 'user' | 'session' | 'realtime'
): number {
  const ttlMap: Record<string, number> = {
    analytics: parseInt(process.env.REDIS_CACHE_TTL_ANALYTICS || '3600', 10), // 1 hora
    catalog: parseInt(process.env.REDIS_CACHE_TTL_EXERCISES || '3600', 10), // 1 hora
    user: 1800, // 30 minutos
    session: parseInt(process.env.REDIS_CACHE_TTL_SESSION || '86400', 10), // 24 horas
    realtime: 300 // 5 minutos
  };
  
  return ttlMap[dataType] || 1800; // Default 30 minutos
}

/**
 * Verifica se deve invalidar cache baseado no método HTTP
 */
export function shouldInvalidateCache(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

/**
 * Gera hash de parâmetros para cache
 */
export function hashParams(params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {} as Record<string, any>);
  
  return crypto.createHash('md5')
    .update(JSON.stringify(sortedParams))
    .digest('hex')
    .substring(0, 8);
}



