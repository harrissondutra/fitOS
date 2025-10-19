import { PrismaClient } from '@prisma/client';
import { PlanLimits, PlanConfig, TenantType } from '../../../shared/types';

export class PlanLimitsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
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
          merged[roleKey] = currentLimit + extra;
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
}
