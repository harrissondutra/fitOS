import { Request, Response, NextFunction } from 'express';
import { PlanLimitsService } from '../services/plan-limits.service';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';

const prisma = getPrismaClient();
const planLimitsService = new PlanLimitsService(prisma);

// Extend Request interface to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * Middleware para verificar se uma feature está habilitada para o tenant
 */
export const requireFeature = (featureName: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Tenant ID não encontrado na requisição'
          }
        });
        return;
      }

      const features = await planLimitsService.getEnabledFeatures(tenantId);

      if (!features[featureName]) {
        res.status(403).json({
          success: false,
          error: {
            message: `Feature ${featureName} não disponível no seu plano`,
            requiredFeature: featureName,
            availableFeatures: Object.keys(features).filter(key => features[key])
          }
        });
        return;
      }

      next();
    } catch (error) {
      console.error(`Erro ao verificar feature ${featureName}:`, error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Erro interno do servidor ao verificar feature'
        }
      });
    }
  };
};

/**
 * Middleware para verificar múltiplas features
 */
export const requireAnyFeature = (featureNames: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: {
            message: 'Tenant ID não encontrado na requisição'
          }
        });
        return;
      }

      const features = await planLimitsService.getEnabledFeatures(tenantId);
      const hasAnyFeature = featureNames.some(feature => features[feature]);

      if (!hasAnyFeature) {
        res.status(403).json({
          success: false,
          error: {
            message: `Pelo menos uma das features é necessária: ${featureNames.join(', ')}`,
            requiredFeatures: featureNames,
            availableFeatures: Object.keys(features).filter(key => features[key])
          }
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar features:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Erro interno do servidor ao verificar features'
        }
      });
    }
  };
};

/**
 * Middleware para verificar se o tenant é do tipo business
 */
export const requireBusinessTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant ID não encontrado na requisição'
        }
      });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tenantType: true }
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Tenant não encontrado'
        }
      });
      return;
    }

    if (tenant.tenantType !== 'business') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Esta funcionalidade está disponível apenas para tenants business',
          tenantType: tenant.tenantType
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar tipo de tenant:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao verificar tipo de tenant'
      }
    });
  }
};

/**
 * Middleware para verificar se o tenant é do tipo individual
 */
export const requireIndividualTenant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant ID não encontrado na requisição'
        }
      });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { tenantType: true }
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Tenant não encontrado'
        }
      });
      return;
    }

    if (tenant.tenantType !== 'individual') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Esta funcionalidade está disponível apenas para tenants individuais',
          tenantType: tenant.tenantType
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar tipo de tenant:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao verificar tipo de tenant'
      }
    });
  }
};
