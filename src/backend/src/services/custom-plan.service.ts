import { PrismaClient } from '@prisma/client';
import { PlanConfig, TenantType } from '../../../shared/types';

export class CustomPlanService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Cria um plano customizado para um tenant específico
   */
  async createCustomPlan(data: {
    tenantId: string;
    displayName: string;
    limits: Record<string, number>;
    price: number;
    extraSlotPrice: Record<string, number>;
    features: Record<string, boolean>;
    contractTerms?: string;
    createdBy: string;
  }): Promise<any> {
    // Gerar slug único baseado no nome do tenant
    const tenant = await this.prisma.tenant.findUnique({ 
      where: { id: data.tenantId } 
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    const slug = this.generateSlug(tenant.name);

    return await this.prisma.planConfig.create({
      data: {
        plan: slug,
        displayName: data.displayName,
        tenantType: tenant.tenantType as TenantType,
        tenantId: data.tenantId,
        isCustom: true,
        limits: data.limits,
        price: data.price,
        extraSlotPrice: data.extraSlotPrice,
        features: data.features,
        contractTerms: data.contractTerms,
        createdBy: data.createdBy,
        isActive: true
      }
    });
  }

  /**
   * Atribui um plano customizado a um tenant
   */
  async assignCustomPlanToTenant(tenantId: string, planId: string): Promise<void> {
    // Validar que o plano pertence ao tenant
    const plan = await this.prisma.planConfig.findUnique({ 
      where: { id: planId } 
    });

    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    if (plan.tenantId !== tenantId) {
      throw new Error('Este plano não pertence a este tenant');
    }

    if (!plan.isActive) {
      throw new Error('Plano não está ativo');
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { 
        customPlanId: planId,
        enabledFeatures: plan.features as any 
      }
    });
  }

  /**
   * Duplica um plano base como customizado para edição
   */
  async duplicatePlanAsCustom(basePlan: string, tenantId: string, createdBy: string): Promise<PlanConfig> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error('Tenant não encontrado');
    }

    const basePlanConfig = await this.prisma.planConfig.findFirst({
      where: {
        plan: basePlan,
        tenantType: tenant.tenantType as TenantType,
        isCustom: false,
        isActive: true
      }
    });

    if (!basePlanConfig) {
      throw new Error('Plano base não encontrado');
    }

    // Criar cópia customizada
    return await this.createCustomPlan({
      tenantId,
      displayName: `${basePlanConfig.displayName} (Customizado)`,
      limits: basePlanConfig.limits as Record<string, number>,
      price: basePlanConfig.price,
      extraSlotPrice: basePlanConfig.extraSlotPrice as Record<string, number>,
      features: basePlanConfig.features as Record<string, boolean>,
      contractTerms: basePlanConfig.contractTerms || undefined,
      createdBy
    });
  }

  /**
   * Atualiza um plano customizado existente
   */
  async updateCustomPlan(planId: string, data: {
    displayName?: string;
    limits?: Record<string, number>;
    price?: number;
    extraSlotPrice?: Record<string, number>;
    features?: Record<string, boolean>;
    contractTerms?: string;
    isActive?: boolean;
  }): Promise<PlanConfig> {
    const plan = await this.prisma.planConfig.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    if (!plan.isCustom) {
      throw new Error('Apenas planos customizados podem ser editados');
    }

    return await this.prisma.planConfig.update({
      where: { id: planId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    }) as any;
  }

  /**
   * Lista planos customizados com filtros
   */
  async listCustomPlans(filters: {
    tenantId?: string;
    isActive?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    plans: any[];
    total: number;
  }> {
    const where: any = {
      isCustom: true
    };

    if (filters.tenantId) {
      where.tenantId = filters.tenantId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { displayName: { contains: filters.search, mode: 'insensitive' } },
        { plan: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [plans, total] = await Promise.all([
      this.prisma.planConfig.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 50,
        skip: filters.offset || 0
      }),
      this.prisma.planConfig.count({ where })
    ]);

    return { plans, total };
  }

  /**
   * Obtém estatísticas de uso de um plano customizado
   */
  async getCustomPlanStats(planId: string): Promise<{
    plan: any;
    tenantCount: number;
    totalRevenue: number;
  }> {
    const plan = await this.prisma.planConfig.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    const tenantCount = await this.prisma.tenant.count({
      where: { customPlanId: planId }
    });

    // Calcular receita total (simplificado - em produção seria mais complexo)
    const totalRevenue = tenantCount * plan.price;

    return {
      plan,
      tenantCount,
      totalRevenue
    };
  }

  /**
   * Remove um plano customizado (soft delete)
   */
  async deactivateCustomPlan(planId: string): Promise<void> {
    const plan = await this.prisma.planConfig.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    if (!plan.isCustom) {
      throw new Error('Apenas planos customizados podem ser desativados');
    }

    // Verificar se há tenants usando este plano
    const tenantCount = await this.prisma.tenant.count({
      where: { customPlanId: planId }
    });

    if (tenantCount > 0) {
      throw new Error('Não é possível desativar plano que está sendo usado por tenants');
    }

    await this.prisma.planConfig.update({
      where: { id: planId },
      data: { isActive: false }
    });
  }

  /**
   * Gera slug único baseado no nome do tenant
   */
  private generateSlug(tenantName: string): string {
    const baseSlug = tenantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();

    const timestamp = Date.now().toString(36);
    return `${baseSlug}-${timestamp}`;
  }

  /**
   * Valida se um plano customizado pode ser criado
   */
  async validateCustomPlanCreation(tenantId: string): Promise<{
    canCreate: boolean;
    reason?: string;
  }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return { canCreate: false, reason: 'Tenant não encontrado' };
    }

    if (tenant.tenantType === 'individual') {
      return { canCreate: false, reason: 'Pessoas físicas não podem ter planos customizados' };
    }

    // Verificar se já tem plano customizado ativo
    const existingCustomPlan = await this.prisma.planConfig.findFirst({
      where: {
        tenantId,
        isCustom: true,
        isActive: true
      }
    });

    if (existingCustomPlan) {
      return { canCreate: false, reason: 'Tenant já possui um plano customizado ativo' };
    }

    return { canCreate: true };
  }
}
