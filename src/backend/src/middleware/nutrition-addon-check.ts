/**
 * Nutrition Addon Check Middleware - Sprint 7
 * Validação de acesso a funcionalidades avançadas via add-ons
 * 
 * NOTA: Temporariamente simplificado - sempre permite acesso
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../shared/types/auth.types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
  tenantId?: string;
  nutritionAddon?: any;
}

/**
 * Middleware para verificar se usuário tem add-on ativo com feature específica
 * TEMPORARIAMENTE: Sempre permite acesso
 */
export const requireNutritionAddon = (featureName: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // TODO: Implementar verificação de addon quando o schema estiver pronto
    // Por enquanto, sempre permitir acesso
    return next();
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

