import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PlanLimitsService } from '../services/plan-limits.service';
import { RequestWithTenant } from './tenant';
import { logger } from '../utils/logger';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';

const prisma = new PrismaClient();
const planLimitsService = new PlanLimitsService(prisma);

interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

/**
 * Middleware para verificar limite de workouts
 */
export const checkWorkoutLimit = async (req: RequestWithTenantAndAuth, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    // SUPER_ADMIN não tem limitações - é o dono do sistema
    if (req.user?.role === 'SUPER_ADMIN') {
      next();
      return;
    }
    
    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
      return;
    }

    const limitCheck = await planLimitsService.checkWorkoutLimit(tenantId);
    
    if (!limitCheck.allowed) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Workout limit exceeded',
          details: {
            current: limitCheck.current,
            limit: limitCheck.limit,
            available: limitCheck.available
          }
        }
      });
      return;
    }

    // Adicionar informações de limite ao request para uso posterior
    (req as any).workoutLimit = limitCheck;
    next();
  } catch (error) {
    logger.error('Error checking workout limit:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Middleware para verificar limite de membros
 */
export const checkClientLimit = async (req: RequestWithTenantAndAuth, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    // SUPER_ADMIN não tem limitações - é o dono do sistema
    if (req.user?.role === 'SUPER_ADMIN') {
      next();
      return;
    }
    
    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
      return;
    }

    const limitCheck = await planLimitsService.checkClientLimit(tenantId);
    
    if (!limitCheck.allowed) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Client limit exceeded',
          details: {
            current: limitCheck.current,
            limit: limitCheck.limit,
            available: limitCheck.available
          }
        }
      });
      return;
    }

    // Adicionar informações de limite ao request para uso posterior
    (req as any).clientLimit = limitCheck;
    next();
  } catch (error) {
    logger.error('Error checking client limit:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Middleware para verificar limite de storage
 */
export const checkStorageLimit = (sizeInMB: number) => {
  return async (req: RequestWithTenantAndAuth, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      
      // SUPER_ADMIN não tem limitações - é o dono do sistema
      if (req.user?.role === 'SUPER_ADMIN') {
        next();
        return;
      }
      
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Tenant not found' }
        });
        return;
      }

      const limitCheck = await planLimitsService.checkStorageLimit(tenantId, sizeInMB);
      
      if (!limitCheck.allowed) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Storage limit exceeded',
            details: {
              current: limitCheck.current,
              limit: limitCheck.limit,
              available: limitCheck.available,
              requested: sizeInMB
            }
          }
        });
        return;
      }

      // Adicionar informações de limite ao request para uso posterior
      (req as any).storageLimit = limitCheck;
      next();
    } catch (error) {
      logger.error('Error checking storage limit:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error' }
      });
    }
  };
};

/**
 * Middleware para tracking automático de eventos
 */
export const trackUsage = (eventType: string) => {
  return async (req: RequestWithTenantAndAuth, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      const userId = req.user?.id;
      
      // SUPER_ADMIN não precisa de tenantId e não deve ter limitações
      if (req.user?.role === 'SUPER_ADMIN') {
        next();
        return;
      }
      
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Tenant not found' }
        });
        return;
      }

      // Verificar se o tenant existe antes de tentar criar o tracking
      const tenantExists = await planLimitsService.tenantExists(tenantId);

      if (!tenantExists) {
        logger.warn(`Tenant ${tenantId} not found, skipping usage tracking`);
        next();
        return;
      }

      // Capturar dados do evento
      const eventData = {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        timestamp: new Date().toISOString()
      };

      // Registrar evento de forma assíncrona (não bloquear a resposta)
      setImmediate(async () => {
        try {
          await planLimitsService.trackEvent(tenantId, eventType, eventData, userId);
        } catch (error) {
          logger.error('Error tracking usage event:', error);
        }
      });

      next();
    } catch (error) {
      logger.error('Error in trackUsage middleware:', error);
      next(); // Continuar mesmo se tracking falhar
    }
  };
};

/**
 * Middleware para verificar se uma feature está habilitada
 */
export const requireFeature = (featureName: string) => {
  return async (req: RequestWithTenantAndAuth, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId || req.user?.tenantId;
      
      // SUPER_ADMIN tem acesso a todas as features - é o dono do sistema
      if (req.user?.role === 'SUPER_ADMIN') {
        next();
        return;
      }
      
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { message: 'Tenant not found' }
        });
        return;
      }

      const enabledFeatures = await planLimitsService.getEnabledFeatures(tenantId);
      
      if (!enabledFeatures[featureName]) {
        res.status(403).json({
          success: false,
          error: {
            message: `Feature '${featureName}' is not enabled for this plan`,
            details: {
              feature: featureName,
              enabledFeatures: Object.keys(enabledFeatures).filter(key => enabledFeatures[key])
            }
          }
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error checking feature:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error' }
      });
    }
  };
};

/**
 * Middleware para obter estatísticas de uso e adicionar ao request
 */
export const getUsageStats = async (req: RequestWithTenantAndAuth, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
      return;
    }

    const usageStats = await planLimitsService.getUsageStats(tenantId);
    (req as any).usageStats = usageStats;
    
    next();
  } catch (error) {
    logger.error('Error getting usage stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

/**
 * Middleware para obter uso do mês atual
 */
export const getCurrentMonthUsage = async (req: RequestWithTenantAndAuth, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    // SUPER_ADMIN não tem limitações - é o dono do sistema
    if (req.user?.role === 'SUPER_ADMIN') {
      next();
      return;
    }
    
    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
      return;
    }

    const monthlyUsage = await planLimitsService.getCurrentMonthUsage(tenantId);
    (req as any).monthlyUsage = monthlyUsage;
    
    next();
  } catch (error) {
    logger.error('Error getting monthly usage:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
};

// Extender interface Request para incluir propriedades de limite
declare global {
  namespace Express {
    interface Request {
      workoutLimit?: {
        allowed: boolean;
        current: number;
        limit: number;
        available: number;
      };
      clientLimit?: {
        allowed: boolean;
        current: number;
        limit: number;
        available: number;
      };
      storageLimit?: {
        allowed: boolean;
        current: number;
        limit: number;
        available: number;
      };
      usageStats?: {
        users: Record<string, number>;
        workouts: number;
        exercises: number;
        clients: number;
        storage: number;
        limits: any;
      };
      monthlyUsage?: {
        workouts: number;
        exercises: number;
        clients: number;
        events: number;
        byDay: Record<string, number>;
      };
    }
  }
}