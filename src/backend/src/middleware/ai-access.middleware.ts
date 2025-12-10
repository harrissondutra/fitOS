/**
 * Middleware para controle de acesso às funcionalidades de IA
 * 
 * Respeita hierarquia de roles e verifica limites de plano
 */

import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../config/database';
import { PlanLimitsService } from '../services/plan-limits.service';
import { UserRole } from '../../../shared/types/auth.types';

export interface AIServiceType {
  type: 'predictions' | 'generation';
  specificType?: string; // Tipo específico de predição/geração
}

/**
 * Middleware para verificar acesso a funcionalidades de IA
 * 
 * Hierarquia: SUPER_ADMIN > ADMIN > PROFESSIONAL > CLIENT
 * 
 * Regras:
 * - SUPER_ADMIN: Acesso total (sem limites)
 * - ADMIN: Acesso a todas features do tenant (respeita limites do plano)
 * - PROFESSIONAL: Acesso limitado a features específicas (respeita limites)
 * - CLIENT: Acesso apenas a predições pessoais (respeita limites)
 */
export const requireAIAccess = (serviceType: AIServiceType) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role as UserRole;
      const userTenantId = req.user?.tenantId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      // Lazy evaluation - criar PrismaClient apenas quando necessário
      const prisma = getPrismaClient();

      // Buscar usuário completo
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          role: true,
          tenantId: true,
          status: true
        }
      });

      if (!user || user.status !== 'ACTIVE') {
        res.status(403).json({
          success: false,
          error: 'Usuário não encontrado ou inativo'
        });
        return;
      }

      // SUPER_ADMIN sempre tem acesso total (tenant system)
      if (user.role === 'SUPER_ADMIN') {
        // Adicionar informações ao request
        req.aiAccess = {
          userId: user.id,
          role: user.role,
          tenantId: user.tenantId || 'system',
          hasAccess: true,
          isUnlimited: true
        };
        return next();
      }

      // Verificar se tem tenantId
      if (!userTenantId) {
        res.status(403).json({
          success: false,
          error: 'Usuário não possui tenant associado'
        });
        return;
      }

      // Verificar se tenant existe e está ativo
      const tenant = await prisma.tenant.findUnique({
        where: { id: userTenantId },
        select: {
          id: true,
          tenantType: true,
          plan: true,
          status: true
        }
      });

      if (!tenant || tenant.status !== 'active') {
        res.status(403).json({
          success: false,
          error: 'Tenant não encontrado ou inativo'
        });
        return;
      }

      const planLimitsService = new PlanLimitsService(prisma);

      // Verificar se feature está habilitada no plano
      const featureName = `ai-${serviceType.type}`;
      const hasFeature = await planLimitsService.checkFeatureAccess(
        userTenantId,
        featureName
      );

      if (!hasFeature && user.role !== 'SUPER_ADMIN') {
        // Verificar se é feature específica permitida
        if (serviceType.specificType) {
          const specificFeatureName = `ai-${serviceType.type}-${serviceType.specificType}`;
          const hasSpecificFeature = await planLimitsService.checkFeatureAccess(
            userTenantId,
            specificFeatureName
          );

          if (!hasSpecificFeature) {
            res.status(403).json({
              success: false,
              error: `Feature ${serviceType.specificType || serviceType.type} não habilitada no seu plano`,
              details: {
                requiredFeature: featureName,
                userRole: user.role,
                plan: tenant.plan
              }
            });
            return;
          }
        } else {
          res.status(403).json({
            success: false,
            error: `Feature de ${serviceType.type === 'predictions' ? 'predições' : 'geraçõe de conteúdo'} não habilitada no seu plano`,
            details: {
              requiredFeature: featureName,
              userRole: user.role,
              plan: tenant.plan
            }
          });
          return;
        }
      }

      // Verificar hierarquia de roles
      const roleHierarchy: Record<string, number> = {
        'SUPER_ADMIN': 4,
        'ADMIN': 3,
        'PROFESSIONAL': 2,
        'EMPLOYEE': 2, // Mesmo nível de PROFESSIONAL
        'CLIENT': 1
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const minRoleLevel = serviceType.type === 'predictions' ? 1 : 2; // CLIENT pode usar predições, PROFESSIONAL+ para geração

      if (userRoleLevel < minRoleLevel) {
        res.status(403).json({
          success: false,
          error: `Role ${user.role} não tem permissão para usar ${serviceType.type === 'predictions' ? 'predições' : 'geraçõe de conteúdo'}`,
          details: {
            userRole: user.role,
            requiredMinRole: minRoleLevel === 1 ? 'CLIENT' : 'PROFESSIONAL'
          }
        });
        return;
      }

      // Verificar limites de tokens/custo (antes de executar)
      // Isso será verificado novamente no service, mas fazemos aqui para retornar erro rápido
      const estimatedTokens = serviceType.type === 'predictions' ? 2000 : 1500;
      const tokenCheck = await planLimitsService.checkAITokenLimit(
        userTenantId,
        estimatedTokens,
        serviceType.specificType
      );

      if (!tokenCheck.allowed && tenant.tenantType !== 'system') {
        res.status(403).json({
          success: false,
          error: tokenCheck.reason || 'Limite de tokens de IA excedido',
          details: {
            current: tokenCheck.current,
            limit: tokenCheck.limit,
            available: tokenCheck.available,
            requested: estimatedTokens
          }
        });
        return;
      }

      // Adicionar informações ao request
      req.aiAccess = {
        userId: user.id,
        role: user.role,
        tenantId: userTenantId,
        hasAccess: true,
        isUnlimited: tenant.tenantType === 'system',
        tokenCheck,
        planLimits: await planLimitsService.getPlanLimits(userTenantId)
      };

      next();
    } catch (error) {
      console.error('Erro ao verificar acesso de IA:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno ao verificar permissões de IA'
      });
    }
  };
};

// Estender interface Request
declare global {
  namespace Express {
    interface Request {
      aiAccess?: {
        userId: string;
        role: string;
        tenantId: string;
        hasAccess: boolean;
        isUnlimited: boolean;
        tokenCheck?: any;
        planLimits?: any;
      };
    }
  }
}

