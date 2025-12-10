/**
 * Nutrition Addon Check Middleware - Sprint 7
 * Validação de acesso a funcionalidades avançadas via add-ons
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { NutritionAddonPlan } from '../services/nutrition-addon.service';

const prisma = new PrismaClient();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role?: string;
  };
  tenantId?: string;
  nutritionAddon?: any;
}

/**
 * Middleware para verificar se usuário tem add-on ativo com feature específica
 */
export const requireNutritionAddon = (featureName: keyof NutritionAddonPlan['features']) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      
      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
      }

      // SUPER_ADMIN sempre tem acesso
      if (req.user?.role === 'SUPER_ADMIN') {
        return next();
      }
      
      // Verificar se tem add-on ativo
      const addon = await prisma.nutritionAddonSubscription.findFirst({
        where: {
          tenantId,
          userId,
          status: { in: ['active', 'trial'] },
          endDate: { gte: new Date() }
        }
      });
      
      if (!addon) {
        return res.status(402).json({ 
          success: false,
          error: 'Upgrade necessário',
          message: 'Esta funcionalidade requer um plano de nutrição avançado',
          upgradeUrl: '/nutritionist/upgrade'
        });
      }
      
      // Verificar se a feature está habilitada
      const features = addon.enabledFeatures as NutritionAddonPlan['features'];
      if (!features[featureName]) {
        return res.status(403).json({ 
          success: false,
          error: 'Feature não disponível',
          message: `Seu plano atual não inclui ${featureName}`,
          upgradeUrl: '/nutritionist/upgrade'
        });
      }
      
      // Verificar créditos AI (se necessário)
      if (['bodyScanAI', 'claraAIAdvanced', 'aiInjuryPrevention'].includes(featureName)) {
        if (addon.aiCreditsUsed >= addon.aiCreditsLimit) {
          return res.status(429).json({ 
            success: false,
            error: 'Créditos AI esgotados',
            message: 'Você atingiu o limite de créditos AI deste mês',
            upgradeUrl: '/nutritionist/upgrade'
          });
        }
      }
      
      // Passar add-on para o request
      req.nutritionAddon = addon;
      return next();
      
    } catch (error) {
      console.error('Erro ao verificar add-on:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Erro interno ao verificar acesso' 
      });
    }
  };
};

/**
 * Middleware para verificar se usuário tem add-on ativo (sem validar feature específica)
 */
export const requireNutritionAddonActive = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  return requireNutritionAddon('professionalPdfExport')(req, res, next);
};

export default {
  requireNutritionAddon,
  requireNutritionAddonActive
};

