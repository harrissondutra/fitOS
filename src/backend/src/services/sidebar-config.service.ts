/**
 * Sidebar Config Service
 * 
 * Gerencia configurações de sidebar por plano e tenant:
 * - Cache Redis para configs padrão do plano (TTL 1h)
 * - Customizações por tenant no PostgreSQL
 * - Filtros automáticos por role e featureLimits
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import Redis from 'ioredis';
import { SidebarMenuItem, SidebarConfig, MenuModule, ROLE_MODULE_MAP } from '../../../shared/types/sidebar.types';
import { PlansConfig } from '../config/plans.config';
import { logger } from '../utils/logger';

export class SidebarConfigService {
  private prisma: PrismaClient;
  private redis: Redis;
  private plansConfig: PlansConfig;
  private readonly CACHE_PREFIX = 'fitos:sidebar:plan:';
  private readonly CACHE_TTL = 3600; // 1 hora
  
  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.plansConfig = new PlansConfig();
  }

  /**
   * Obter configuração de sidebar para um tenant
   * 
   * Fluxo:
   * 1. Busca tenant e plano
   * 2. Busca config padrão do plano (Redis → PostgreSQL)
   * 3. Obtém featureLimits do plano
   * 4. Filtra por módulos permitidos para o role
   * 5. Aplica customizações do tenant
   * 6. Filtra por featureLimits e roles
   */
  async getSidebarForTenant(tenantId: string, userRole: string): Promise<SidebarMenuItem[]> {
    try {
      // 1. Buscar tenant e seu plano
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { sidebarCustomization: true }
      });
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // 2. Buscar configuração padrão do plano (cache Redis)
      let defaultConfig: SidebarMenuItem[] = await this.getPlanConfig(tenant.plan);
      
      // 3. Obter limites de features do plano
      const plan = await this.plansConfig.getPlanById(tenant.plan);
      const featureLimits = plan?.limits;
      
      // 4. Obter módulos permitidos para o role
      const allowedModules = ROLE_MODULE_MAP[userRole] || ['core'];
      
      logger.info('Building sidebar for tenant', {
        tenantId,
        plan: tenant.plan,
        userRole,
        allowedModules
      });
      
      // 5. Aplicar customizações do tenant (se existirem)
      let finalMenus = this.applyTenantCustomizations(defaultConfig, tenant.sidebarCustomization);
      
      // 6. Filtrar por módulos permitidos para o role
      finalMenus = finalMenus.filter(menu => allowedModules.includes(menu.module));
      
      // 7. Filtrar por featureLimits e roles
      finalMenus = this.filterByFeatureLimitsAndRoles(finalMenus, featureLimits, userRole);
      
      return finalMenus;
      
    } catch (error) {
      logger.error('Error getting sidebar config:', error);
      throw error;
    }
  }

  /**
   * Obter configuração padrão de um plano (com cache Redis)
   */
  async getPlanConfig(plan: string): Promise<SidebarMenuItem[]> {
    const cacheKey = `${this.CACHE_PREFIX}${plan}`;
    
    // Tentar buscar do cache
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        logger.debug(`Sidebar config loaded from Redis cache for plan: ${plan}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      logger.warn('Redis cache error, falling back to database:', error);
    }
    
    // Buscar do banco
    const dbConfig = await this.prisma.sidebarMenuConfig.findFirst({
      where: { plan, isActive: true },
      orderBy: { version: 'desc' }
    });
    
    if (!dbConfig) {
      logger.warn(`No sidebar config found for plan: ${plan}, returning empty`);
      return [];
    }
    
    const menuItems = dbConfig.menuItems as unknown as SidebarMenuItem[];
    
    // Cachear no Redis
    try {
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(menuItems));
      logger.debug(`Sidebar config cached in Redis for plan: ${plan}`);
    } catch (error) {
      logger.warn('Failed to cache in Redis:', error);
    }
    
    return menuItems;
  }

  /**
   * Aplicar customizações do tenant
   */
  private applyTenantCustomizations(
    defaultMenus: SidebarMenuItem[],
    customization: any
  ): SidebarMenuItem[] {
    if (!customization) return defaultMenus;
    
    let menus = [...defaultMenus];
    
    // Aplicar customizações (renomear, ícones customizados)
    menus = menus.map(menu => {
      const custom = customization.customizations?.[menu.id];
      if (custom) {
        return {
          ...menu,
          title: custom.customTitle || menu.title,
          icon: custom.customIcon || menu.icon
        };
      }
      return menu;
    });
    
    // Ocultar menus
    if (customization.hiddenMenuIds?.length > 0) {
      menus = menus.filter(menu => !customization.hiddenMenuIds.includes(menu.id));
    }
    
    // Reordenar baseado em menuOrder
    if (customization.menuOrder?.length > 0) {
      menus.sort((a, b) => {
        const indexA = customization.menuOrder.indexOf(a.id);
        const indexB = customization.menuOrder.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    
    return menus;
  }

  /**
   * Filtrar menus baseado em featureLimits e roles
   */
  private filterByFeatureLimitsAndRoles(
    menus: SidebarMenuItem[], 
    featureLimits: any,
    userRole: string
  ): SidebarMenuItem[] {
    return menus
      .filter(menu => {
        // Verificar feature limits
        if (menu.requiredFeature && featureLimits) {
          if (featureLimits[menu.requiredFeature] === false) {
            logger.debug(`Menu ${menu.id} hidden due to feature limit: ${menu.requiredFeature}`);
            return false;
          }
        }
        
        // Verificar roles
        if (menu.requiredRoles && menu.requiredRoles.length > 0) {
          if (!menu.requiredRoles.includes(userRole)) {
            logger.debug(`Menu ${menu.id} hidden due to role restriction`);
            return false;
          }
        }
        
        return menu.isVisible;
      })
      .map(menu => ({
        ...menu,
        items: menu.items?.filter(subMenu => {
          if (subMenu.requiredFeature && featureLimits) {
            if (featureLimits[subMenu.requiredFeature] === false) {
              return false;
            }
          }
          if (subMenu.requiredRoles && subMenu.requiredRoles.length > 0) {
            if (!subMenu.requiredRoles.includes(userRole)) {
              return false;
            }
          }
          return subMenu.isVisible;
        })
      }));
  }

  /**
   * Salvar configuração padrão de sidebar para um plano (SUPER_ADMIN)
   */
  async savePlanDefaultConfig(
    plan: string, 
    menuItems: SidebarMenuItem[], 
    createdBy: string,
    changelog?: string
  ): Promise<void> {
    try {
      // Desativar versão anterior
      await this.prisma.sidebarMenuConfig.updateMany({
        where: { plan, isActive: true },
        data: { isActive: false }
      });
      
      // Criar nova versão
      const latestVersion = await this.prisma.sidebarMenuConfig.findFirst({
        where: { plan },
        orderBy: { version: 'desc' }
      });
      
      const newVersion = (latestVersion?.version || 0) + 1;
      
      await this.prisma.sidebarMenuConfig.create({
        data: {
          plan,
          menuItems: menuItems as any,
          version: newVersion,
          createdBy,
          changelog,
          isActive: true
        }
      });
      
      // Invalidar cache Redis
      await this.redis.del(`${this.CACHE_PREFIX}${plan}`);
      
      // Log de auditoria
      await this.prisma.sidebarAuditLog.create({
        data: {
          userId: createdBy,
          action: 'UPDATE_PLAN_CONFIG',
          entityType: 'plan',
          entityId: plan,
          changes: {
            version: newVersion,
            changelog,
            menuItemsCount: menuItems.length
          }
        }
      });
      
      logger.info('Plan sidebar config saved', { plan, version: newVersion, createdBy });
      
    } catch (error) {
      logger.error('Error saving plan config:', error);
      throw error;
    }
  }

  /**
   * Salvar customização de sidebar de um tenant (OWNER)
   */
  async saveTenantCustomization(
    tenantId: string,
    userId: string,
    customization: {
      hiddenMenuIds: string[];
      menuOrder: string[];
      customizations: any;
    }
  ): Promise<void> {
    try {
      await this.prisma.tenantSidebarCustomization.upsert({
        where: { tenantId },
        create: {
          tenantId,
          hiddenMenuIds: customization.hiddenMenuIds,
          menuOrder: customization.menuOrder,
          customizations: customization.customizations,
          lastModifiedBy: userId
        },
        update: {
          hiddenMenuIds: customization.hiddenMenuIds,
          menuOrder: customization.menuOrder,
          customizations: customization.customizations,
          lastModifiedBy: userId,
          updatedAt: new Date()
        }
      });
      
      // Log de auditoria
      await this.prisma.sidebarAuditLog.create({
        data: {
          tenantId,
          userId,
          action: 'CUSTOMIZE_TENANT',
          entityType: 'tenant',
          entityId: tenantId,
          changes: customization
        }
      });
      
      logger.info('Tenant sidebar customization saved', { tenantId, userId });
      
    } catch (error) {
      logger.error('Error saving tenant customization:', error);
      throw error;
    }
  }

  /**
   * Preview de configuração (para testar antes de salvar)
   */
  async previewConfig(plan: string, userRole: string): Promise<SidebarMenuItem[]> {
    const menuItems = await this.getPlanConfig(plan);
    const allowedModules = ROLE_MODULE_MAP[userRole] || ['core'];
    
    return menuItems.filter(menu => allowedModules.includes(menu.module));
  }

  /**
   * Obter histórico de versões de um plano
   */
  async getVersionHistory(plan: string): Promise<SidebarConfig[]> {
    const versions = await this.prisma.sidebarMenuConfig.findMany({
      where: { plan },
      orderBy: { version: 'desc' },
      take: 10
    });
    
    return versions.map(v => ({
      plan: v.plan,
      menuItems: v.menuItems as unknown as SidebarMenuItem[],
      version: v.version,
      changelog: v.changelog || undefined
    }));
  }
}

