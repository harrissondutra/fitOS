import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { PlanLimitsService } from '../services/plan-limits.service';

const router = Router();
const prisma = new PrismaClient();
const planLimitsService = new PlanLimitsService(prisma);

// Extend Request interface to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

// === Novas rotas para gestão de planos e limites ===

/**
 * GET /api/admin/plan-info
 * Ver plano atual (base ou custom), limites e uso
 */
router.get('/plan-info', asyncHandler(async (req: any, res: Response): Promise<void> => {
  // Usar tenant padrão temporariamente
  const tenantId = req.tenantId === 'default' ? 'default-tenant' : (req.tenantId || 'default-tenant');

  console.log('🔍 Plan-info request - tenantId original:', req.tenantId);
  console.log('🔍 Plan-info request - tenantId final:', tenantId);

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    include: { customPlan: true }
  });

  if (!tenant) {
    res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
    return;
  }

  const userCounts = await planLimitsService.getUserCountByRole(tenantId);
  const limits = await planLimitsService.getPlanLimits(tenantId);
  const features = await planLimitsService.getEnabledFeatures(tenantId);

  res.json({
    success: true,
    data: {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        tenantType: tenant.tenantType,
        plan: tenant.plan,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
        isCustomPlan: !!tenant.customPlanId,
        customPlan: tenant.customPlan
      },
      limits,
      usage: userCounts,
      features,
      canHaveSubdomain: await planLimitsService.canHaveSubdomain(tenant.tenantType)
    }
  });
}));

/**
 * GET /api/admin/users/by-role
 * Contagem de usuários por role
 */
router.get('/users/by-role', requireAdmin, asyncHandler(async (req: any, res: Response): Promise<void> => {
  const tenantId = req.tenantId;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
    return;
  }

  const userCounts = await planLimitsService.getUserCountByRole(tenantId);
  const limits = await planLimitsService.getPlanLimits(tenantId);

  // Calcular disponibilidade por role
  const availability = Object.keys(limits).reduce((acc, role) => {
    const current = userCounts[role] || 0;
    const limit = limits[role as keyof typeof limits];
    const isUnlimited = limit === -1;
    
    acc[role] = {
      current,
      limit: isUnlimited ? -1 : limit,
      available: isUnlimited ? -1 : Math.max(0, limit - current),
      isUnlimited
    };
    
    return acc;
  }, {} as Record<string, any>);

  res.json({
    success: true,
    data: {
      usage: userCounts,
      limits,
      availability
    }
  });
}));

/**
 * POST /api/admin/request-extra-slots
 * Solicitar slots extras (gera pedido para super admin aprovar)
 */
router.post('/request-extra-slots', requireAdmin, asyncHandler(async (req: any, res: Response): Promise<void> => {
  const tenantId = req.tenantId;
  const { role, quantity, reason } = req.body;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
    return;
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  });

  if (!tenant) {
    res.status(404).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
    return;
  }

  // Validar que tenant é business
  if (tenant.tenantType === 'individual') {
    res.status(400).json({
      success: false,
      error: { 
        message: 'Pessoas físicas não podem solicitar slots extras',
        details: { tenantType: tenant.tenantType }
      }
    });
    return;
  }

  // TODO: Implementar sistema de solicitações para super admin
  // Por enquanto, apenas retorna sucesso
  res.json({
    success: true,
    message: 'Solicitação de slots extras enviada para aprovação',
    data: {
      role,
      quantity,
      reason,
      status: 'pending'
    }
  });
}));

/**
 * POST /api/admin/request-upgrade-to-business
 * Pessoa física solicitar upgrade para business (criar subdomain)
 */
router.post('/request-upgrade-to-business', requireAdmin, asyncHandler(async (req: any, res: Response): Promise<void> => {
  const tenantId = req.tenantId;
  const { subdomain } = req.body;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
    return;
  }

  const validation = await planLimitsService.canConvertToBusiness(tenantId);
  
  if (!validation.canConvert) {
    res.status(400).json({
      success: false,
      error: { message: validation.reason }
    });
    return;
  }

  // Verificar se subdomain já existe
  const existingTenant = await prisma.tenant.findUnique({
    where: { subdomain }
  });

  if (existingTenant) {
    res.status(400).json({
      success: false,
      error: { message: 'Subdomain já está em uso' }
    });
    return;
  }

  // TODO: Implementar sistema de solicitações para super admin
  // Por enquanto, apenas retorna sucesso
  res.json({
    success: true,
    message: 'Solicitação de upgrade para business enviada para aprovação',
    data: {
      subdomain,
      status: 'pending'
    }
  });
}));

/**
 * POST /api/admin/request-feature
 * Solicitar habilitação de feature específica
 */
router.post('/request-feature', requireAdmin, asyncHandler(async (req: any, res: Response): Promise<void> => {
  const tenantId = req.tenantId;
  const { featureName, reason } = req.body;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: { message: 'Tenant not found' }
    });
    return;
  }

  const features = await planLimitsService.getEnabledFeatures(tenantId);

  if (features[featureName]) {
    res.status(400).json({
      success: false,
      error: { message: 'Feature já está habilitada' }
    });
    return;
  }

  // TODO: Implementar sistema de solicitações para super admin
  // Por enquanto, apenas retorna sucesso
  res.json({
    success: true,
    message: 'Solicitação de feature enviada para aprovação',
    data: {
      featureName,
      reason,
      status: 'pending'
    }
  });
}));

export default router;
