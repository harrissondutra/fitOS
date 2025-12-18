import { ConnectionManagerService, connectionManager } from '../services/connection-manager.service';
import { PrismaTenantWrapper } from '../services/prisma-tenant-wrapper.service';
import { DbStrategy } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from './logger';

// Cache to prevent object churn and reduce GC pressure
const tenantWrapperCache = new Map<string, PrismaTenantWrapper>();

// Simple interval to clear cache every hour to prevent stale growth
setInterval(() => {
  tenantWrapperCache.clear();
  logger.info('Cleared tenantWrapperCache to release memory');
}, 60 * 60 * 1000);

/**
 * Helper para obter PrismaTenantWrapper para uma organização
 * Integra ConnectionManagerService com PrismaTenantWrapper
 */
export async function getTenantPrismaWrapper(
  organizationId: string,
  allowCrossTenant: boolean = false
): Promise<PrismaTenantWrapper> {
  const cacheKey = `${organizationId}:${allowCrossTenant}`;

  if (tenantWrapperCache.has(cacheKey)) {
    return tenantWrapperCache.get(cacheKey)!;
  }

  const strategy = await connectionManager.getOrganizationStrategy(organizationId);
  const prisma = await connectionManager.getConnection(organizationId);

  const wrapper = new PrismaTenantWrapper(
    prisma,
    organizationId,
    strategy,
    allowCrossTenant
  );

  tenantWrapperCache.set(cacheKey, wrapper);
  return wrapper;
}

/**
 * Helper para obter PrismaTenantWrapper para uso em services
 * Usa o PrismaClient principal quando não há tenant context específico
 */
export async function getTenantPrismaWrapperSafe(
  organizationId: string | null | undefined,
  allowCrossTenant: boolean = false
): Promise<PrismaTenantWrapper | ReturnType<typeof getPrismaClient>> {
  // Se não há organizationId, retornar PrismaClient principal (para queries globais)
  if (!organizationId) {
    logger.warn('No organizationId provided, returning main PrismaClient');
    return getPrismaClient();
  }

  try {
    return await getTenantPrismaWrapper(organizationId, allowCrossTenant);
  } catch (error) {
    logger.error('Error getting tenant Prisma wrapper, falling back to main PrismaClient:', error);
    return getPrismaClient();
  }
}

