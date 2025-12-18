import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../services/tenant.service';
import { logger } from '../utils/logger';
import { getDynamicPrismaClient } from '../config/dynamic-prisma';

export interface RequestWithSchemaTenant extends Request {
  tenant?: {
    id: string;
    name: string;
    subdomain?: string;
    customDomain?: string;
    plan: string;
    tenantType: any;
    customPlanId?: string;
    planLimits: any;
    extraSlots: any;
    enabledFeatures: any;
    status: any;
    billingEmail: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    settings: any;
    schemaName: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  prisma?: ReturnType<typeof getDynamicPrismaClient>; // Adiciona o cliente Prisma dinâmico
}

const tenantService = new TenantService(null as any);

export const schemaTenantMiddleware = async (
  req: RequestWithSchemaTenant,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip tenant resolution for health check endpoints
    if (req.path.startsWith('/api/health')) {
      next();
      return;
    }

    const host = req.get('host') || '';
    const tenantId = req.headers['x-tenant-id'] as string;

    let tenant: any = null;

    // Tenta resolver o tenant por ID primeiro (para chamadas de API)
    if (tenantId) {
      tenant = await tenantService.resolveTenantById(tenantId);
    } else {
      // Tenta resolver o tenant por hostname
      tenant = await tenantService.resolveTenantByHost(host);
    }

    if (!tenant) {
      logger.warn('Tenant not found', { host, tenantId });
      res.status(404).json({
        success: false,
        error: {
          message: 'Tenant not found',
        },
      });
      return;
    }

    if (tenant.status !== 'active') {
      logger.warn('Tenant not active', { tenantId: tenant.id, status: tenant.status });
      res.status(403).json({
        success: false,
        error: {
          message: 'Tenant is not active',
        },
      });
      return;
    }

    // Anexar tenant à requisição
    req.tenant = tenant;

    // Determinar o nome do schema do tenant
    const tenantSchemaName = `tenant_${tenant.id.replace(/-/g, '_')}`; // Ex: tenant_clg000000000000000000000

    // Selecionar o cliente Prisma correto baseado na estratégia
    if (tenant.dbStrategy === 'row_level') {
      // Para row-level, usar singleton global (conexão compartilhada)
      // O isolamento é feito via filtro (tenantId) nas queries
      const { getPrismaClient } = require('../config/database');
      req.prisma = getPrismaClient();
    }
    else if (tenant.dbStrategy === 'database_level') {
      // Para database-level, obter conexão dedicada do manager (que tem cache)
      const { connectionManager } = require('../services/connection-manager.service');
      // getConnection é async e gerencia cache interno
      req.prisma = await connectionManager.getConnection(tenant.id);
    }
    else {
      // Default: schema_level (schema isolado no mesmo banco)
      // Usa dynamic prisma que muda o search_path
      req.prisma = getDynamicPrismaClient(tenantSchemaName);
    }

    // Adicionar tenant ID ao cabeçalho da resposta
    res.set('X-Tenant-ID', tenant.id);

    next();
  } catch (error) {
    logger.error('Schema Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    });
  }
};