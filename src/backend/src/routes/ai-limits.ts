import { Router } from 'express';
import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/superAdmin';
import { asyncHandler } from '../utils/async-handler';
import { GlobalLimitsService } from '../services/global-limits.service';
import { aiCostTrackingService } from '../services/ai-cost-tracking.service';
import { createAiProviderService } from '../utils/service-factory';

const router = Router();
const globalLimitsService = new GlobalLimitsService();

// Aplicar middleware de autenticação ANTES de requireSuperAdmin (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  authMiddleware.requireAuth({ checkSessionActivity: false })(req, res, next);
});

// Aplicar middleware de super admin
router.use(requireSuperAdmin);

/**
 * GET /api/super-admin/ai/limits
 * Lista todos os limites de IA
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  const providerService = createAiProviderService(req);

  try {
    // 1. Obter limites globais de todos os planos
    const globalLimits = await globalLimitsService.findAll();
    
    // 2. Obter estatísticas de uso atual
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Últimos 30 dias

    const costSummary = await aiCostTrackingService.getCostSummary(startDate, endDate);
    
    // 3. Obter provedores ativos
    const providersResult = await providerService.listProviders({}, { page: 1, limit: 1000 });
    const providers = providersResult.data || [];

    // 4. Transformar limites globais em formato da interface Limit
    const limits: any[] = [];

    // Processar limites de cada plano
    for (const planLimit of globalLimits) {
      const aiLimits = planLimit.aiLimits as any;
      const rateLimits = planLimit.rateLimits as any;

      // Rate Limit Global
      if (rateLimits?.aiRequestsPerMinute) {
        limits.push({
          id: `rate-global-${planLimit.plan}`,
          name: `Rate Limit Global - ${planLimit.plan}`,
          description: `Limite global de requisições de IA por minuto para o plano ${planLimit.plan}`,
          category: 'rate',
          type: 'global',
          value: rateLimits.aiRequestsPerMinute,
          unit: 'requests',
          period: 'minute',
          isActive: true,
          isEnforced: true,
          currentUsage: 0, // Será calculado abaixo
          lastReset: new Date(),
          createdAt: planLimit.createdAt,
          updatedAt: planLimit.updatedAt,
          plan: planLimit.plan
        });
      }

      // Custo Mensal
      if (aiLimits?.monthlyBudget) {
        const monthlyCost = costSummary.totalCost || 0;
        limits.push({
          id: `cost-monthly-${planLimit.plan}`,
          name: `Custo Mensal - ${planLimit.plan}`,
          description: `Limite de custo total de IA por mês para o plano ${planLimit.plan}`,
          category: 'cost',
          type: 'global',
          value: aiLimits.monthlyBudget,
          unit: 'dollars',
          period: 'month',
          isActive: true,
          isEnforced: true,
          currentUsage: monthlyCost,
          lastReset: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          createdAt: planLimit.createdAt,
          updatedAt: planLimit.updatedAt,
          plan: planLimit.plan
        });
      }

      // Tokens por Mês
      if (aiLimits?.maxTokensPerMonth) {
        const tokensUsed = costSummary.totalInputTokens + costSummary.totalOutputTokens || 0;
        limits.push({
          id: `tokens-monthly-${planLimit.plan}`,
          name: `Tokens Mensais - ${planLimit.plan}`,
          description: `Limite de tokens por mês para o plano ${planLimit.plan}`,
          category: 'usage',
          type: 'global',
          value: aiLimits.maxTokensPerMonth,
          unit: 'tokens',
          period: 'month',
          isActive: true,
          isEnforced: true,
          currentUsage: tokensUsed,
          lastReset: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          createdAt: planLimit.createdAt,
          updatedAt: planLimit.updatedAt,
          plan: planLimit.plan
        });
      }

      // Requisições Concorrentes
      if (aiLimits?.maxConcurrentRequests) {
        limits.push({
          id: `concurrent-${planLimit.plan}`,
          name: `Requisições Concorrentes - ${planLimit.plan}`,
          description: `Número máximo de requisições simultâneas de IA para o plano ${planLimit.plan}`,
          category: 'concurrent',
          type: 'global',
          value: aiLimits.maxConcurrentRequests,
          unit: 'requests',
          period: 'minute',
          isActive: true,
          isEnforced: true,
          currentUsage: 0, // Não rastreado atualmente
          lastReset: new Date(),
          createdAt: planLimit.createdAt,
          updatedAt: planLimit.updatedAt,
          plan: planLimit.plan
        });
      }

      // Limites por provedor
      if (aiLimits?.openai) {
        const openaiProvider = providers.find(p => p.provider === 'OPENAI');
        const openaiCost = costSummary.costByProvider?.openai || 0;
        limits.push({
          id: `rate-openai-${planLimit.plan}`,
          name: `Rate Limit OpenAI - ${planLimit.plan}`,
          description: `Limite específico para provedor OpenAI no plano ${planLimit.plan}`,
          category: 'rate',
          type: 'per_provider',
          value: aiLimits.openai.maxRequestsPerMonth || 0,
          unit: 'requests',
          period: 'month',
          isActive: !!openaiProvider?.isActive,
          isEnforced: true,
          currentUsage: 0,
          lastReset: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          createdAt: planLimit.createdAt,
          updatedAt: planLimit.updatedAt,
          plan: planLimit.plan,
          provider: 'OPENAI'
        });
      }
    }

    // 5. Calcular uso atual de rate limits (últimas 24h)
    const last24Hours = new Date();
    last24Hours.setHours(last24Hours.getHours() - 24);

    const recentRequests = await prisma.aiCostTracking.count({
      where: {
        timestamp: {
          gte: last24Hours
        }
      }
    });

    const requestsPerMinute = recentRequests > 0 ? Math.round(recentRequests / (24 * 60)) : 0;

    // Atualizar currentUsage dos rate limits
    limits.forEach(limit => {
      if (limit.category === 'rate' && limit.period === 'minute') {
        limit.currentUsage = requestsPerMinute;
      }
    });

    res.json({
      success: true,
      data: limits
    });
  } catch (error: any) {
    console.error('Erro ao obter limites:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter limites'
    });
  }
}));

/**
 * PUT /api/super-admin/ai/limits/:id
 * Atualiza um limite específico
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { value, isActive, isEnforced } = req.body;

  try {
    // Extrair informações do ID (formato: category-type-plan)
    const parts = id.split('-');
    if (parts.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'ID de limite inválido'
      });
    }

    const plan = parts[parts.length - 1];
    const category = parts[0];
    const type = parts[1];

    // Buscar limites do plano
    const planLimits = await globalLimitsService.findByPlan(plan);
    if (!planLimits) {
      return res.status(404).json({
        success: false,
        error: 'Limites do plano não encontrados'
      });
    }

    // Atualizar limite específico
    const updateData: any = {};
    
    if (category === 'rate' && planLimits.rateLimits) {
      const rateLimits = planLimits.rateLimits as any;
      if (type === 'global') {
        rateLimits.aiRequestsPerMinute = value;
      }
      updateData.rateLimits = rateLimits;
    } else if (category === 'cost' && planLimits.aiLimits) {
      const aiLimits = planLimits.aiLimits as any;
      aiLimits.monthlyBudget = value;
      updateData.aiLimits = aiLimits;
    } else if (category === 'usage' && planLimits.aiLimits) {
      const aiLimits = planLimits.aiLimits as any;
      aiLimits.maxTokensPerMonth = value;
      updateData.aiLimits = aiLimits;
    } else if (category === 'concurrent' && planLimits.aiLimits) {
      const aiLimits = planLimits.aiLimits as any;
      aiLimits.maxConcurrentRequests = value;
      updateData.aiLimits = aiLimits;
    }

    await globalLimitsService.update(plan, updateData);

    res.json({
      success: true,
      message: 'Limite atualizado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao atualizar limite:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar limite'
    });
  }
}));

export default router;

