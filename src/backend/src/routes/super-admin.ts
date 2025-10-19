import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { requireSuperAdmin, requireAdminOrSuperAdmin, requireTenantAccess } from '../middleware/superAdmin';
import { PlanLimitsService } from '../services/plan-limits.service';
import { CustomPlanService } from '../services/custom-plan.service';
import { PaymentService } from '../services/payment.service';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const prisma = new PrismaClient();
const planLimitsService = new PlanLimitsService(prisma);
const customPlanService = new CustomPlanService(prisma);
const paymentService = new PaymentService();

// Aplicar middleware de autenticação em todas as rotas
router.use(requireAuth);

// === Gestão de Tenants ===

/**
 * GET /api/super-admin/tenants
 * Listar todos os tenants com estatísticas de uso
 */
router.get('/tenants', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    tenantType, 
    hasCustomPlan, 
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  const where: any = {};

  if (tenantType) {
    where.tenantType = tenantType;
  }

  if (hasCustomPlan !== undefined) {
    where.customPlanId = hasCustomPlan === 'true' ? { not: null } : null;
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { subdomain: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      where,
      include: {
        customPlan: true,
        _count: {
          select: {
            users: true,
            members: true
          }
        }
      },
      orderBy: { [sortBy as string]: sortOrder },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    }),
    prisma.tenant.count({ where })
  ]);

  // Adicionar estatísticas de uso para cada tenant
  const tenantsWithStats = await Promise.all(
    tenants.map(async (tenant) => {
      const userCounts = await planLimitsService.getUserCountByRole(tenant.id);
      const limits = await planLimitsService.getPlanLimits(tenant.id);
      const features = await planLimitsService.getEnabledFeatures(tenant.id);

      return {
        ...tenant,
        stats: {
          userCounts,
          limits,
          features,
          isCustomPlan: !!tenant.customPlanId
        }
      };
    })
  );

  res.json({
    success: true,
    data: {
      tenants: tenantsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

/**
 * GET /api/super-admin/tenants/:id
 * Detalhes de um tenant específico
 */
router.get('/tenants/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      customPlan: true,
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          members: true,
          workouts: true
        }
      }
    }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant não encontrado' }
    });
  }

  const userCounts = await planLimitsService.getUserCountByRole(tenant.id);
  const limits = await planLimitsService.getPlanLimits(tenant.id);
  const features = await planLimitsService.getEnabledFeatures(tenant.id);

  res.json({
    success: true,
    data: {
      ...tenant,
      stats: {
        userCounts,
        limits,
        features,
        isCustomPlan: !!tenant.customPlanId
      }
    }
  });
}));

/**
 * PUT /api/super-admin/tenants/:id/plan
 * Alterar plano de um tenant (base ou custom)
 */
router.put('/tenants/:id/plan', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { planId, planType } = req.body; // planType: 'base' | 'custom'

  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant não encontrado' }
    });
  }

  if (planType === 'custom') {
    // Atribuir plano customizado
    await customPlanService.assignCustomPlanToTenant(id, planId);
  } else {
    // Atribuir plano base
    await prisma.tenant.update({
      where: { id },
      data: {
        plan: planId,
        customPlanId: null
      }
    });
  }

  res.json({
    success: true,
    message: 'Plano atualizado com sucesso'
  });
}));

/**
 * PUT /api/super-admin/tenants/:id/extra-slots
 * Adicionar/remover slots extras
 */
router.put('/tenants/:id/extra-slots', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, quantity } = req.body;

  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant não encontrado' }
    });
  }

  if (tenant.tenantType === 'individual') {
    return res.status(400).json({
      success: false,
      error: { message: 'Pessoas físicas não podem ter slots extras' }
    });
  }

  await planLimitsService.addExtraSlots(id, role, quantity);

  res.json({
    success: true,
    message: 'Slots extras atualizados com sucesso'
  });
}));

/**
 * PUT /api/super-admin/tenants/:id/features
 * Habilitar/desabilitar features específicas para um tenant
 */
router.put('/tenants/:id/features', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { features } = req.body; // { featureName: boolean }

  const tenant = await prisma.tenant.findUnique({
    where: { id }
  });

  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant não encontrado' }
    });
  }

  const currentFeatures = tenant.enabledFeatures as Record<string, boolean> || {};
  const updatedFeatures = { ...currentFeatures, ...features };

  await prisma.tenant.update({
    where: { id },
    data: { enabledFeatures: updatedFeatures }
  });

  res.json({
    success: true,
    message: 'Features atualizadas com sucesso'
  });
}));

/**
 * PUT /api/super-admin/tenants/:id/type
 * Converter de individual para business
 */
router.put('/tenants/:id/type', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { subdomain } = req.body;

  const validation = await planLimitsService.canConvertToBusiness(id);
  
  if (!validation.canConvert) {
    return res.status(400).json({
      success: false,
      error: { message: validation.reason }
    });
  }

  await planLimitsService.convertToBusiness(id, subdomain);

  res.json({
    success: true,
    message: 'Tenant convertido para business com sucesso'
  });
}));

// === Gestão de Planos Base ===

/**
 * GET /api/super-admin/plan-configs
 * Listar configurações de planos (base e custom)
 */
router.get('/plan-configs', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { 
    isCustom, 
    tenantType, 
    isActive,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const where: any = {};

  if (isCustom !== undefined) {
    where.isCustom = isCustom === 'true';
  }

  if (tenantType) {
    where.tenantType = tenantType;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { displayName: { contains: search as string, mode: 'insensitive' } },
      { plan: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const [plans, total] = await Promise.all([
    prisma.planConfig.findMany({
      where,
      include: {
        _count: {
          select: { tenants: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: (Number(page) - 1) * Number(limit)
    }),
    prisma.planConfig.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      plans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    }
  });
}));

/**
 * POST /api/super-admin/plan-configs
 * Criar novo plano base
 */
router.post('/plan-configs', requireSuperAdmin, asyncHandler(async (req, res) => {
  const {
    plan,
    displayName,
    tenantType,
    limits,
    price,
    extraSlotPrice,
    features,
    contractTerms
  } = req.body;

  const planConfig = await prisma.planConfig.create({
    data: {
      plan,
      displayName,
      tenantType,
      isCustom: false,
      limits,
      price,
      extraSlotPrice,
      features,
      contractTerms,
      isActive: true,
      createdBy: req.superAdmin!.id
    }
  });

  res.status(201).json({
    success: true,
    data: planConfig,
    message: 'Plano base criado com sucesso'
  });
}));

/**
 * PUT /api/super-admin/plan-configs/:id
 * Atualizar plano base
 */
router.put('/plan-configs/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const planConfig = await prisma.planConfig.findUnique({
    where: { id }
  });

  if (!planConfig) {
    return res.status(404).json({
      success: false,
      error: { message: 'Plano não encontrado' }
    });
  }

  if (planConfig.isCustom) {
    return res.status(400).json({
      success: false,
      error: { message: 'Use a rota de planos customizados para editar este plano' }
    });
  }

  const updatedPlan = await prisma.planConfig.update({
    where: { id },
    data: {
      ...updateData,
      updatedAt: new Date()
    }
  });

  res.json({
    success: true,
    data: updatedPlan,
    message: 'Plano atualizado com sucesso'
  });
}));

/**
 * DELETE /api/super-admin/plan-configs/:id
 * Desativar plano base
 */
router.delete('/plan-configs/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const planConfig = await prisma.planConfig.findUnique({
    where: { id }
  });

  if (!planConfig) {
    return res.status(404).json({
      success: false,
      error: { message: 'Plano não encontrado' }
    });
  }

  if (planConfig.isCustom) {
    return res.status(400).json({
      success: false,
      error: { message: 'Use a rota de planos customizados para desativar este plano' }
    });
  }

  // Verificar se há tenants usando este plano
  const tenantCount = await prisma.tenant.count({
    where: { plan: planConfig.plan }
  });

  if (tenantCount > 0) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Não é possível desativar plano que está sendo usado por tenants',
        details: { tenantCount }
      }
    });
  }

  await prisma.planConfig.update({
    where: { id },
    data: { isActive: false }
  });

  res.json({
    success: true,
    message: 'Plano desativado com sucesso'
  });
}));

// === Gestão de Planos Customizados ===

/**
 * POST /api/super-admin/custom-plans
 * Criar plano customizado para tenant específico
 */
router.post('/custom-plans', requireSuperAdmin, asyncHandler(async (req, res) => {
  const {
    tenantId,
    displayName,
    limits,
    price,
    extraSlotPrice,
    features,
    contractTerms
  } = req.body;

  const validation = await customPlanService.validateCustomPlanCreation(tenantId);
  
  if (!validation.canCreate) {
    return res.status(400).json({
      success: false,
      error: { message: validation.reason }
    });
  }

  const customPlan = await customPlanService.createCustomPlan({
    tenantId,
    displayName,
    limits,
    price,
    extraSlotPrice,
    features,
    contractTerms,
    createdBy: req.superAdmin!.id
  });

  res.status(201).json({
    success: true,
    data: customPlan,
    message: 'Plano customizado criado com sucesso'
  });
}));

/**
 * POST /api/super-admin/custom-plans/duplicate
 * Duplicar plano base como customizado
 */
router.post('/custom-plans/duplicate', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { basePlan, tenantId } = req.body;

  const customPlan = await customPlanService.duplicatePlanAsCustom(
    basePlan, 
    tenantId, 
    req.superAdmin!.id
  );

  res.status(201).json({
    success: true,
    data: customPlan,
    message: 'Plano duplicado como customizado com sucesso'
  });
}));

/**
 * PUT /api/super-admin/custom-plans/:id
 * Editar plano customizado existente
 */
router.put('/custom-plans/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const customPlan = await customPlanService.updateCustomPlan(id, updateData);

  res.json({
    success: true,
    data: customPlan,
    message: 'Plano customizado atualizado com sucesso'
  });
}));

/**
 * POST /api/super-admin/custom-plans/:id/assign
 * Atribuir plano customizado ao tenant
 */
router.post('/custom-plans/:id/assign', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.body;

  await customPlanService.assignCustomPlanToTenant(tenantId, id);

  res.json({
    success: true,
    message: 'Plano customizado atribuído com sucesso'
  });
}));

/**
 * GET /api/super-admin/custom-plans
 * Listar planos customizados
 */
router.get('/custom-plans', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { tenantId, isActive, search, page = 1, limit = 20 } = req.query;

  const result = await customPlanService.listCustomPlans({
    tenantId: tenantId as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    search: search as string,
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit)
  });

  res.json({
    success: true,
    data: {
      plans: result.plans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: result.total,
        pages: Math.ceil(result.total / Number(limit))
      }
    }
  });
}));

/**
 * GET /api/super-admin/custom-plans/:id/stats
 * Estatísticas de um plano customizado
 */
router.get('/custom-plans/:id/stats', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const stats = await customPlanService.getCustomPlanStats(id);

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * DELETE /api/super-admin/custom-plans/:id
 * Desativar plano customizado
 */
router.delete('/custom-plans/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  await customPlanService.deactivateCustomPlan(id);

  res.json({
    success: true,
    message: 'Plano customizado desativado com sucesso'
  });
}));

// === Gestão de Pagamentos ===

/**
 * GET /api/super-admin/tenants/:id/payments
 * Buscar histórico de pagamentos com dados do Stripe/MercadoPago
 */
router.get('/tenants/:id/payments', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Buscar subscription e invoices do banco
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: id },
    include: { 
      plan: true,
      invoices: { orderBy: { createdAt: 'desc' } }
    }
  });
  
  let realTimeData: any = null;
  
  // Se tem stripeSubscriptionId, buscar dados em tempo real do Stripe
  if (subscription?.stripeSubscriptionId) {
    try {
      const stripeData = await paymentService.getStripeSubscriptionDetails(subscription.stripeSubscriptionId);
      realTimeData = { ...realTimeData, ...stripeData };
    } catch (error) {
      console.error('Erro ao buscar dados do Stripe:', error);
    }
  }
  
  // Se tem mercadoPagoId, buscar do Mercado Pago
  if (subscription?.mercadoPagoId) {
    try {
      const mercadoPagoData = await paymentService.getMercadoPagoPaymentsByTenant(id);
      realTimeData = { ...realTimeData, mercadoPagoPayments: mercadoPagoData };
    } catch (error) {
      console.error('Erro ao buscar dados do Mercado Pago:', error);
    }
  }
  
  res.json({ 
    success: true,
    data: {
      subscription,
      realTimeData
    }
  });
}));

/**
 * PUT /api/super-admin/tenants/:id/status
 * Ativar/Inativar/Suspender tenant
 */
router.put('/tenants/:id/status', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' | 'inactive' | 'suspended'
  
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Status inválido. Use: active, inactive ou suspended' }
    });
  }
  
  await prisma.tenant.update({
    where: { id },
    data: { status }
  });
  
  res.json({ 
    success: true,
    message: `Tenant ${status === 'active' ? 'ativado' : status === 'inactive' ? 'inativado' : 'suspenso'} com sucesso`
  });
}));

/**
 * GET /api/super-admin/tenants/:id/users
 * Buscar usuários de um tenant específico
 */
router.get('/tenants/:id/users', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const users = await prisma.user.findMany({
    where: { tenantId: id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
  
  res.json({ 
    success: true,
    data: { users }
  });
}));

/**
 * DELETE /api/super-admin/tenants/:id
 * Excluir tenant (soft delete recomendado)
 */
router.delete('/tenants/:id', requireSuperAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Verificar se pode excluir
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: { _count: { select: { users: true, members: true } } }
  });
  
  if (!tenant) {
    return res.status(404).json({
      success: false,
      error: { message: 'Tenant não encontrado' }
    });
  }
  
  if (tenant._count.users > 0 || tenant._count.members > 0) {
    return res.status(400).json({
      success: false,
      error: { 
        message: 'Não é possível excluir tenant com usuários ou membros',
        details: { 
          users: tenant._count.users, 
          members: tenant._count.members 
        }
      }
    });
  }
  
  // Soft delete
  await prisma.tenant.update({
    where: { id },
    data: { status: 'deleted' }
  });
  
  res.json({ 
    success: true,
    message: 'Tenant excluído com sucesso'
  });
}));

export default router;
