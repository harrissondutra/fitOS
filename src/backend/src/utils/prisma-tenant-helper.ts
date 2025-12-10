import { ConnectionManagerService } from '../services/connection-manager.service';
import { PrismaTenantWrapper } from '../services/prisma-tenant-wrapper.service';
import { DbStrategy } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from './logger';

/**
 * Helper para obter PrismaTenantWrapper para uma organização
 * Integra ConnectionManagerService com PrismaTenantWrapper
 */
export async function getTenantPrismaWrapper(
  organizationId: string,
  allowCrossTenant: boolean = false
): Promise<PrismaTenantWrapper> {
  const connectionManager = new ConnectionManagerService();
  const strategy = await connectionManager.getOrganizationStrategy(organizationId);
  const prisma = await connectionManager.getConnection(organizationId);

  return new PrismaTenantWrapper(
    prisma,
    organizationId,
    strategy,
    allowCrossTenant
  );
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

