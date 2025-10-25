import { PrismaClient } from '@prisma/client';
import { GlobalLimitsService } from './global-limits.service';
import { IntegrationService } from './integration.service';

// Tipos locais para o serviço
export interface PlanLimits {
  super_admin?: number;
  owner?: number;
  admin?: number;
  trainer?: number;
  member?: number;
  nutritionist?: number;
  crmContacts?: number;
  workouts?: number;
  exercises?: number;
  storage?: number; // em MB
  // Novos limites expandidos
  aiTokens?: number; // tokens de IA por mês
  aiCost?: number; // custo de IA por mês em R$
  uploadQuota?: number; // quota de upload por mês em MB
  maxFileSize?: number; // tamanho máximo de arquivo em MB
  apiRequests?: number; // requisições de API por minuto
  webhookCalls?: number; // chamadas de webhook por minuto
}

// Interface para limites de IA
export interface AILimits {
  globalMonthlyTokens: number;
  perServiceType: {
    [key: string]: {
      monthlyTokens: number;
      costBudget: number;
    };
  };
}

// Interface para limites de upload
export interface UploadLimits {
  maxFileSizeMB: number;
  totalStorageGB: number;
  allowedFileTypes: string[];
  monthlyUploadQuotaGB: number;
}

// Interface para limites de features
export interface FeatureLimits {
  [key: string]: boolean | number;
}

// Interface para rate limits
export interface RateLimits {
  apiRequestsPerMinute: number;
  webhookCallsPerMinute: number;
}

// Interface para resultado de validação
export interface ValidationResult {
  allowed: boolean;
  current: number;
  limit: number;
  available: number;
  reason?: string;
}

export interface PlanConfig {
  id: string;
  plan: string;
  displayName: string;
  tenantType: string;
  limits: PlanLimits;
  price: number;
  extraSlotPrice: Record<string, number>;
  features: Record<string, boolean>;
  isActive: boolean;
}

export type TenantType = 'individual' | 'business';
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'MEMBER';

export class PlanLimitsService {
  private prisma: PrismaClient;
  private globalLimitsService: GlobalLimitsService;
  private integrationService: IntegrationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.globalLimitsService = new GlobalLimitsService();
    this.integrationService = new IntegrationService();
  }

  /**
   * Obtém os limites do plano para um tenant específico
   */
  async getPlanLimits(tenantId: string): Promise<PlanLimits> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { customPlan: true }
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    // Tenant "Sistema" tem acesso total (para SUPER_ADMIN)
    if (tenant.tenantType === 'system') {
      return await this.getSuperAdminLimits();
    }

    // Prioridade: plano customizado > plano base
    const planConfig = tenant.customPlanId 
      ? tenant.customPlan 
      : await this.getBasePlanConfig(tenant.plan, tenant.tenantType as TenantType);

    if (!planConfig) {
      throw new Error('Configuração de plano não encontrada');
    }

    // Somar limites base + extraSlots
    return this.mergeLimits(planConfig.limits as any, tenant.extraSlots as Record<string, number>);
  }

  /**
   * Obtém limites especiais para SUPER_ADMIN (sem restrições)
   */
  async getSuperAdminLimits(): Promise<PlanLimits> {
    return {
      super_admin: -1, // ilimitado
      admin: -1, // ilimitado
      trainer: -1, // ilimitado
      member: -1 // ilimitado
    };
  }

  /**
   * Verifica se um usuário pode ser criado com a role especificada
   */
  async checkUserLimit(tenantId: string, role: string): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    available: number;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    // Tenant "Sistema" (SUPER_ADMIN) não tem restrições de limite
    if (tenant.tenantType === 'system') {
      return {
        allowed: true,
        current: 0,
        limit: -1, // ilimitado
        available: -1 // ilimitado
      };
    }

    // Para pessoa física (individual), limitar a 1 usuário total
    if (tenant.tenantType === 'individual') {
      const totalUsers = await this.prisma.user.count({
        where: { tenantId }
      });

      return {
        allowed: totalUsers < 1,
        current: totalUsers,
        limit: 1,
        available: Math.max(0, 1 - totalUsers)
      };
    }

    // Para business, verificar limite por role
    const limits = await this.getPlanLimits(tenantId);
    const currentCount = await this.prisma.user.count({
      where: { 
        tenantId,
        role: role.toUpperCase()
      }
    });

    // Converter SUPER_ADMIN para super_admin para compatibilidade com PlanLimits
    const roleKey = (role === 'SUPER_ADMIN' ? 'super_admin' : role.toLowerCase()) as keyof PlanLimits;
    const limit = limits[roleKey] || 0;

    // -1 significa ilimitado
    const isUnlimited = limit === -1;
    const allowed = isUnlimited || currentCount < limit;

    return {
      allowed,
      current: currentCount,
      limit: isUnlimited ? -1 : limit,
      available: isUnlimited ? -1 : Math.max(0, limit - currentCount)
    };
  }

  /**
   * Adiciona slots extras para um tenant
   */
  async addExtraSlots(tenantId: string, role: string, quantity: number): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    // Validar que tenant é tipo "business" (pessoa física não pode ter extras)
    if (tenant.tenantType === 'individual') {
      throw new Error('Pessoas físicas não podem ter slots extras');
    }

    const currentExtraSlots = tenant.extraSlots as Record<string, number> || {};
    const newQuantity = (currentExtraSlots[role] || 0) + quantity;

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        extraSlots: {
          ...currentExtraSlots,
          [role]: newQuantity
        }
      }
    });
  }

  /**
   * Obtém contagem de usuários por role para um tenant
   */
  async getUserCountByRole(tenantId: string): Promise<Record<string, number>> {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: { role: true }
    });

    const counts: Record<string, number> = {};
    users.forEach(user => {
      // Converter SUPER_ADMIN para super_admin para compatibilidade com PlanLimits
      const role = user.role === 'SUPER_ADMIN' ? 'super_admin' : (user.role || 'member').toLowerCase();
      counts[role] = (counts[role] || 0) + 1;
    });

    return counts;
  }

  /**
   * Verifica se um tenant pode ter subdomain
   */
  async canHaveSubdomain(tenantType: string): Promise<boolean> {
    return tenantType === 'business';
  }

  /**
   * Obtém features habilitadas para um tenant
   */
  async getEnabledFeatures(tenantId: string): Promise<Record<string, boolean>> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { customPlan: true }
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    // Prioridade: tenant.enabledFeatures > plano.features
    const planConfig = tenant.customPlanId 
      ? tenant.customPlan 
      : await this.getBasePlanConfig(tenant.plan, tenant.tenantType as TenantType);

    const planFeatures = planConfig?.features as Record<string, boolean> || {};
    const tenantFeatures = tenant.enabledFeatures as Record<string, boolean> || {};

    return { ...planFeatures, ...tenantFeatures };
  }

  /**
   * Obtém configuração de plano base
   */
  private async getBasePlanConfig(plan: string, tenantType: TenantType): Promise<any | null> {
    return await this.prisma.planConfig.findFirst({
      where: {
        plan,
        tenantType,
        isCustom: false,
        isActive: true
      }
    }) as any;
  }

  /**
   * Combina limites base com slots extras
   */
  private mergeLimits(baseLimits: PlanLimits, extraSlots: Record<string, number>): PlanLimits {
    const merged: PlanLimits = { ...baseLimits };

    Object.entries(extraSlots).forEach(([role, extra]) => {
      // Converter SUPER_ADMIN para super_admin para compatibilidade com PlanLimits
      const roleKey = (role === 'SUPER_ADMIN' ? 'super_admin' : role.toLowerCase()) as keyof PlanLimits;
      if (roleKey in merged) {
        const currentLimit = merged[roleKey];
        // Se limite atual é ilimitado (-1), mantém ilimitado
        if (currentLimit === -1) {
          merged[roleKey] = -1;
        } else {
          merged[roleKey] = (currentLimit || 0) + extra;
        }
      }
    });

    return merged;
  }

  /**
   * Valida se um tenant pode ser convertido de individual para business
   */
  async canConvertToBusiness(tenantId: string): Promise<{
    canConvert: boolean;
    reason?: string;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return { canConvert: false, reason: 'Tenant não encontrado' };
    }

    if (tenant.tenantType === 'business') {
      return { canConvert: false, reason: 'Tenant já é do tipo business' };
    }

    // Verificar se já tem subdomain
    if (tenant.subdomain) {
      return { canConvert: false, reason: 'Tenant já possui subdomain' };
    }

    return { canConvert: true };
  }

  /**
   * Converte tenant de individual para business
   */
  async convertToBusiness(tenantId: string, subdomain: string): Promise<void> {
    const validation = await this.canConvertToBusiness(tenantId);
    
    if (!validation.canConvert) {
      throw new Error(validation.reason);
    }

    // Verificar se subdomain já existe
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { subdomain }
    });

    if (existingTenant) {
      throw new Error('Subdomain já está em uso');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        tenantType: 'business',
        subdomain,
        plan: 'starter' // Upgrade automático para starter
      }
    });
  }

  /**
   * Verifica limite de workouts para um tenant
   */
  async checkWorkoutLimit(tenantId: string): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    available: number;
  }> {
    const limits = await this.getPlanLimits(tenantId);
    const currentCount = await this.prisma.workout.count({
      where: { tenantId }
    });

    const limit = limits.workouts || 0;
    const isUnlimited = limit === -1;
    const allowed = isUnlimited || currentCount < limit;

    return {
      allowed,
      current: currentCount,
      limit: isUnlimited ? -1 : limit,
      available: isUnlimited ? -1 : Math.max(0, limit - currentCount)
    };
  }

  /**
   * Verifica limite de membros para um tenant
   */
  async checkClientLimit(tenantId: string): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    available: number;
  }> {
    const limits = await this.getPlanLimits(tenantId);
    const currentCount = await this.prisma.client.count({
      where: { tenantId }
    });

    const limit = limits.member || 0;
    const isUnlimited = limit === -1;
    const allowed = isUnlimited || currentCount < limit;

    return {
      allowed,
      current: currentCount,
      limit: isUnlimited ? -1 : limit,
      available: isUnlimited ? -1 : Math.max(0, limit - currentCount)
    };
  }

  /**
   * Verifica limite de storage para um tenant
   */
  async checkStorageLimit(tenantId: string, sizeInMB: number): Promise<{
    allowed: boolean;
    current: number;
    limit: number;
    available: number;
  }> {
    const limits = await this.getPlanLimits(tenantId);
    
    // Calcular storage atual (simplificado - apenas workouts e exercícios)
    const workoutCount = await this.prisma.workout.count({
      where: { tenantId }
    });
    const exerciseCount = await this.prisma.exercise.count({
      where: { tenantId }
    });
    
    // Estimativa: 1KB por workout, 2KB por exercício
    const currentStorageMB = (workoutCount * 0.001) + (exerciseCount * 0.002);

    const limit = limits.storage || 0;
    const isUnlimited = limit === -1;
    const allowed = isUnlimited || (currentStorageMB + sizeInMB) <= limit;

    return {
      allowed,
      current: Math.round(currentStorageMB * 100) / 100,
      limit: isUnlimited ? -1 : limit,
      available: isUnlimited ? -1 : Math.max(0, limit - currentStorageMB)
    };
  }

  /**
   * Obtém estatísticas de uso para um tenant
   */
  async getUsageStats(tenantId: string): Promise<{
    users: Record<string, number>;
    workouts: number;
    exercises: number;
    members: number;
    storage: number;
    limits: PlanLimits;
  }> {
    const limits = await this.getPlanLimits(tenantId);
    const userCounts = await this.getUserCountByRole(tenantId);
    
    const [workoutCount, exerciseCount, memberCount] = await Promise.all([
      this.prisma.workout.count({ where: { tenantId } }),
      this.prisma.exercise.count({ where: { tenantId } }),
      this.prisma.client.count({ where: { tenantId } })
    ]);

    // Calcular storage atual
    const currentStorageMB = (workoutCount * 0.001) + (exerciseCount * 0.002);

    return {
      users: userCounts,
      workouts: workoutCount,
      exercises: exerciseCount,
      members: memberCount,
      storage: Math.round(currentStorageMB * 100) / 100,
      limits
    };
  }

  /**
   * Verifica se um tenant existe
   */
  async tenantExists(tenantId: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true }
    });
    return !!tenant;
  }

  /**
   * Registra evento de uso para tracking
   */
  async trackEvent(tenantId: string, eventType: string, eventData: any, userId?: string): Promise<void> {
    await this.prisma.usageTracking.create({
      data: {
        tenantId,
        eventType,
        eventData,
        userId,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: 'FitOS Backend'
        }
      }
    });
  }

  /**
   * Obtém uso do mês atual
   */
  async getCurrentMonthUsage(tenantId: string): Promise<{
    workouts: number;
    exercises: number;
    members: number;
    events: number;
    byDay: Record<string, number>;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [workouts, exercises, members, events] = await Promise.all([
      this.prisma.workout.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      this.prisma.exercise.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      this.prisma.client.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      }),
      this.prisma.usageTracking.count({
        where: {
          tenantId,
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      })
    ]);

    // Agrupar eventos por dia
    const eventsByDay = await this.prisma.usageTracking.groupBy({
      by: ['createdAt'],
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _count: {
        id: true
      }
    });

    const byDay: Record<string, number> = {};
    eventsByDay.forEach(event => {
      const day = event.createdAt.toISOString().split('T')[0];
      byDay[day] = event._count.id;
    });

    return {
      workouts,
      exercises,
      members,
      events,
      byDay
    };
  }

  // ===== NOVOS MÉTODOS PARA VALIDAÇÃO DE IA =====

  /**
   * Verifica limite de tokens de IA para um tenant
   */
  async checkAITokenLimit(tenantId: string, tokensToUse: number, serviceType?: string): Promise<ValidationResult> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Tenant não encontrado'
        };
      }

      // Tenant "Sistema" (SUPER_ADMIN) não tem restrições
      if (tenant.tenantType === 'system') {
        return {
          allowed: true,
          current: 0,
          limit: -1,
          available: -1
        };
      }

      // Obter limites globais do plano
      const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);
      if (!globalLimits) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Limites globais não encontrados'
        };
      }

      // Calcular uso atual do mês
      const currentUsage = await this.getCurrentMonthAIUsage(tenantId, serviceType);
      const limit = serviceType 
        ? globalLimits.overrides?.aiLimits?.[serviceType]?.maxTokensPerMonth || 0
        : globalLimits.overrides?.aiLimits?.maxTokensPerMonth || 0;

      const isUnlimited = limit === -1;
      const allowed = isUnlimited || (currentUsage + tokensToUse) <= limit;

      return {
        allowed,
        current: currentUsage,
        limit: isUnlimited ? -1 : limit,
        available: isUnlimited ? -1 : Math.max(0, limit - currentUsage),
        reason: !allowed ? `Limite de tokens excedido. Uso atual: ${currentUsage}, Tentativa: ${tokensToUse}, Limite: ${limit}` : undefined
      };
    } catch (error) {
      console.error('Error checking AI token limit:', error);
      return {
        allowed: false,
        current: 0,
        limit: 0,
        available: 0,
        reason: 'Erro interno ao verificar limite de IA'
      };
    }
  }

  /**
   * Verifica limite de custo de IA para um tenant
   */
  async checkAICostLimit(tenantId: string, costToAdd: number, serviceType?: string): Promise<ValidationResult> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Tenant não encontrado'
        };
      }

      // Tenant "Sistema" (SUPER_ADMIN) não tem restrições
      if (tenant.tenantType === 'system') {
        return {
          allowed: true,
          current: 0,
          limit: -1,
          available: -1
        };
      }

      // Obter limites globais do plano
      const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);
      if (!globalLimits) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Limites globais não encontrados'
        };
      }

      // Calcular custo atual do mês
      const currentCost = await this.getCurrentMonthAICost(tenantId, serviceType);
      const limit = serviceType 
        ? globalLimits.overrides?.aiLimits?.[serviceType]?.maxTokensPerMonth || 0
        : globalLimits.overrides?.aiLimits?.monthlyBudget || 0;

      const isUnlimited = limit === -1;
      const allowed = isUnlimited || (currentCost + costToAdd) <= limit;

      return {
        allowed,
        current: currentCost,
        limit: isUnlimited ? -1 : limit,
        available: isUnlimited ? -1 : Math.max(0, limit - currentCost),
        reason: !allowed ? `Limite de custo de IA excedido. Custo atual: R$ ${currentCost.toFixed(2)}, Tentativa: R$ ${costToAdd.toFixed(2)}, Limite: R$ ${limit.toFixed(2)}` : undefined
      };
    } catch (error) {
      console.error('Error checking AI cost limit:', error);
      return {
        allowed: false,
        current: 0,
        limit: 0,
        available: 0,
        reason: 'Erro interno ao verificar limite de custo de IA'
      };
    }
  }

  /**
   * Obtém uso atual de tokens de IA do mês
   */
  async getCurrentMonthAIUsage(tenantId: string, serviceType?: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const whereClause: any = {
      integration: {
        integration: { in: ['openai', 'anthropic', 'groq', 'ollama'] }
      },
      eventType: 'api_call',
      timestamp: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      metadata: {
        path: ['tenantId'],
        equals: tenantId
      }
    };

    if (serviceType) {
      whereClause.integration.integration = serviceType;
    }

    const logs = await this.prisma.integrationUsageLog.findMany({
      where: whereClause,
      select: {
        tokensUsed: true
      }
    });

    return logs.reduce((total, log) => total + (log.tokensUsed || 0), 0);
  }

  /**
   * Obtém custo atual de IA do mês
   */
  async getCurrentMonthAICost(tenantId: string, serviceType?: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const whereClause: any = {
      integration: {
        integration: { in: ['openai', 'anthropic', 'groq', 'ollama'] }
      },
      eventType: 'api_call',
      timestamp: {
        gte: startOfMonth,
        lte: endOfMonth
      },
      metadata: {
        path: ['tenantId'],
        equals: tenantId
      }
    };

    if (serviceType) {
      whereClause.integration.integration = serviceType;
    }

    const logs = await this.prisma.integrationUsageLog.findMany({
      where: whereClause,
      select: {
        cost: true
      }
    });

    return logs.reduce((total, log) => total + (log.cost || 0), 0);
  }

  // ===== NOVOS MÉTODOS PARA VALIDAÇÃO DE UPLOAD =====

  /**
   * Verifica limite de quota de upload para um tenant
   */
  async checkUploadQuotaLimit(tenantId: string, sizeInMB: number): Promise<ValidationResult> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Tenant não encontrado'
        };
      }

      // Tenant "Sistema" (SUPER_ADMIN) não tem restrições
      if (tenant.tenantType === 'system') {
        return {
          allowed: true,
          current: 0,
          limit: -1,
          available: -1
        };
      }

      // Obter limites globais do plano
      const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);
      if (!globalLimits) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Limites globais não encontrados'
        };
      }

      // Calcular uso atual do mês
      const currentUsage = await this.getCurrentMonthUploadUsage(tenantId);
      const limit = globalLimits.overrides?.uploadLimits?.monthlyUploadQuota || 0; // Already in MB

      const isUnlimited = limit === -1;
      const allowed = isUnlimited || (currentUsage + sizeInMB) <= limit;

      return {
        allowed,
        current: currentUsage,
        limit: isUnlimited ? -1 : limit,
        available: isUnlimited ? -1 : Math.max(0, limit - currentUsage),
        reason: !allowed ? `Quota de upload excedida. Uso atual: ${currentUsage}MB, Tentativa: ${sizeInMB}MB, Limite: ${limit}MB` : undefined
      };
    } catch (error) {
      console.error('Error checking upload quota limit:', error);
      return {
        allowed: false,
        current: 0,
        limit: 0,
        available: 0,
        reason: 'Erro interno ao verificar quota de upload'
      };
    }
  }

  /**
   * Verifica limite de tamanho de arquivo para um tenant
   */
  async checkFileSizeLimit(tenantId: string, fileSizeInMB: number): Promise<ValidationResult> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Tenant não encontrado'
        };
      }

      // Tenant "Sistema" (SUPER_ADMIN) não tem restrições
      if (tenant.tenantType === 'system') {
        return {
          allowed: true,
          current: 0,
          limit: -1,
          available: -1
        };
      }

      // Obter limites globais do plano
      const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);
      if (!globalLimits) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Limites globais não encontrados'
        };
      }

      const limit = globalLimits.overrides?.uploadLimits?.maxFileSize || 0;
      const allowed = fileSizeInMB <= limit;

      return {
        allowed,
        current: fileSizeInMB,
        limit,
        available: Math.max(0, limit - fileSizeInMB),
        reason: !allowed ? `Arquivo muito grande. Tamanho: ${fileSizeInMB}MB, Limite: ${limit}MB` : undefined
      };
    } catch (error) {
      console.error('Error checking file size limit:', error);
      return {
        allowed: false,
        current: 0,
        limit: 0,
        available: 0,
        reason: 'Erro interno ao verificar limite de tamanho de arquivo'
      };
    }
  }

  /**
   * Obtém uso atual de upload do mês
   */
  async getCurrentMonthUploadUsage(tenantId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const logs = await this.prisma.integrationUsageLog.findMany({
      where: {
        integration: {
          integration: 'file-upload'
        },
        eventType: 'file_upload',
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        metadata: {
          path: ['tenantId'],
          equals: tenantId
        }
      },
      select: {
        metadata: true
      }
    });

    // Somar tamanhos dos arquivos em MB
    let totalSizeMB = 0;
    for (const log of logs) {
      const metadata = log.metadata as any;
      const fileSize = metadata?.fileSize as number;
      if (fileSize) {
        totalSizeMB += fileSize / (1024 * 1024); // Convert bytes to MB
      }
    }

    return Math.round(totalSizeMB * 100) / 100; // Round to 2 decimal places
  }

  // ===== NOVOS MÉTODOS PARA RATE LIMITING =====

  /**
   * Verifica rate limit de requisições de API para um tenant
   */
  async checkAPIRateLimit(tenantId: string): Promise<ValidationResult> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Tenant não encontrado'
        };
      }

      // Tenant "Sistema" (SUPER_ADMIN) não tem restrições
      if (tenant.tenantType === 'system') {
        return {
          allowed: true,
          current: 0,
          limit: -1,
          available: -1
        };
      }

      // Obter limites globais do plano
      const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);
      if (!globalLimits) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Limites globais não encontrados'
        };
      }

      // Contar requisições da última hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const requestCount = await this.prisma.integrationUsageLog.count({
        where: {
          metadata: {
            path: ['tenantId'],
            equals: tenantId
          },
          eventType: 'api_call',
          timestamp: {
            gte: oneHourAgo
          }
        }
      });

      const limit = (globalLimits.overrides?.rateLimits?.apiRequestsPerMinute || 0) * 60; // Convert per minute to per hour
      const allowed = requestCount < limit;

      return {
        allowed,
        current: requestCount,
        limit,
        available: Math.max(0, limit - requestCount),
        reason: !allowed ? `Rate limit de API excedido. Requisições na última hora: ${requestCount}, Limite: ${limit}` : undefined
      };
    } catch (error) {
      console.error('Error checking API rate limit:', error);
      return {
        allowed: false,
        current: 0,
        limit: 0,
        available: 0,
        reason: 'Erro interno ao verificar rate limit de API'
      };
    }
  }

  /**
   * Verifica rate limit de webhooks para um tenant
   */
  async checkWebhookRateLimit(tenantId: string): Promise<ValidationResult> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Tenant não encontrado'
        };
      }

      // Tenant "Sistema" (SUPER_ADMIN) não tem restrições
      if (tenant.tenantType === 'system') {
        return {
          allowed: true,
          current: 0,
          limit: -1,
          available: -1
        };
      }

      // Obter limites globais do plano
      const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);
      if (!globalLimits) {
        return {
          allowed: false,
          current: 0,
          limit: 0,
          available: 0,
          reason: 'Limites globais não encontrados'
        };
      }

      // Contar webhooks da última hora
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const webhookCount = await this.prisma.integrationUsageLog.count({
        where: {
          metadata: {
            path: ['tenantId'],
            equals: tenantId
          },
          eventType: 'webhook',
          timestamp: {
            gte: oneHourAgo
          }
        }
      });

      const limit = (globalLimits.overrides?.rateLimits?.requestsPerMinute || 0) * 60; // Convert per minute to per hour
      const allowed = webhookCount < limit;

      return {
        allowed,
        current: webhookCount,
        limit,
        available: Math.max(0, limit - webhookCount),
        reason: !allowed ? `Rate limit de webhook excedido. Webhooks na última hora: ${webhookCount}, Limite: ${limit}` : undefined
      };
    } catch (error) {
      console.error('Error checking webhook rate limit:', error);
      return {
        allowed: false,
        current: 0,
        limit: 0,
        available: 0,
        reason: 'Erro interno ao verificar rate limit de webhook'
      };
    }
  }

  // ===== MÉTODOS PARA VALIDAÇÃO DE FEATURES =====

  /**
   * Verifica se uma feature está habilitada para um tenant
   */
  async checkFeatureAccess(tenantId: string, featureName: string): Promise<boolean> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return false;
      }

      // Tenant "Sistema" (SUPER_ADMIN) tem acesso a todas features
      if (tenant.tenantType === 'system') {
        return true;
      }

      // Obter limites globais do plano
      const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);
      if (!globalLimits) {
        return false;
      }

      // Verificar se a feature está habilitada
      const featureEnabled = globalLimits.overrides?.featureLimits?.[featureName] || false;
      return Boolean(featureEnabled);
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Obtém todas as features habilitadas para um tenant
   */
  // ===== MÉTODOS PARA ESTATÍSTICAS EXPANDIDAS =====

  /**
   * Obtém estatísticas completas de uso para um tenant
   */
  async getCompleteUsageStats(tenantId: string): Promise<{
    users: Record<string, number>;
    workouts: number;
    exercises: number;
    members: number;
    storage: number;
    limits: PlanLimits;
    ai: {
      tokensUsed: number;
      costIncurred: number;
      tokensLimit: number;
      costLimit: number;
    };
    uploads: {
      quotaUsed: number;
      quotaLimit: number;
      filesUploaded: number;
    };
    rateLimits: {
      apiRequests: number;
      webhookCalls: number;
    };
    features: Record<string, boolean>;
  }> {
    const basicStats = await this.getUsageStats(tenantId);
    const aiTokensUsed = await this.getCurrentMonthAIUsage(tenantId);
    const aiCostIncurred = await this.getCurrentMonthAICost(tenantId);
    const uploadQuotaUsed = await this.getCurrentMonthUploadUsage(tenantId);
    const features = await this.getEnabledFeatures(tenantId);

    // Obter limites globais
    const globalLimits = await this.globalLimitsService.getTenantOverride(tenantId);

    return {
      ...basicStats,
      ai: {
        tokensUsed: aiTokensUsed,
        costIncurred: aiCostIncurred,
        tokensLimit: globalLimits?.overrides?.aiLimits?.maxTokensPerMonth || 0,
        costLimit: globalLimits?.overrides?.aiLimits?.monthlyBudget || 0
      },
      uploads: {
        quotaUsed: uploadQuotaUsed,
        quotaLimit: globalLimits?.overrides?.uploadLimits?.monthlyUploadQuota || 0, // Already in MB
        filesUploaded: await this.getCurrentMonthFileCount(tenantId)
      },
      rateLimits: {
        apiRequests: await this.getCurrentHourAPICount(tenantId),
        webhookCalls: await this.getCurrentHourWebhookCount(tenantId)
      },
      features
    };
  }

  /**
   * Obtém contagem de arquivos do mês atual
   */
  private async getCurrentMonthFileCount(tenantId: string): Promise<number> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return await this.prisma.integrationUsageLog.count({
      where: {
        integration: {
          integration: 'file-upload'
        },
        eventType: 'file_upload',
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth
        },
        metadata: {
          path: ['tenantId'],
          equals: tenantId
        }
      }
    });
  }

  /**
   * Obtém contagem de requisições de API da última hora
   */
  private async getCurrentHourAPICount(tenantId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return await this.prisma.integrationUsageLog.count({
      where: {
        metadata: {
          path: ['tenantId'],
          equals: tenantId
        },
        eventType: 'api_call',
        timestamp: {
          gte: oneHourAgo
        }
      }
    });
  }

  /**
   * Obtém contagem de webhooks da última hora
   */
  private async getCurrentHourWebhookCount(tenantId: string): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    return await this.prisma.integrationUsageLog.count({
      where: {
        metadata: {
          path: ['tenantId'],
          equals: tenantId
        },
        eventType: 'webhook',
        timestamp: {
          gte: oneHourAgo
        }
      }
    });
  }
}
