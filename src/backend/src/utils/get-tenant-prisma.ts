import { Request } from 'express';
import { PrismaClient, DbStrategy } from '@prisma/client';
import { PrismaTenantWrapper } from '../services/prisma-tenant-wrapper.service';
import { getPrismaClient } from '../config/database';
import { logger } from './logger';

/**
 * Obtém PrismaTenantWrapper do request (se disponível) ou PrismaClient padrão
 * Usar este helper em services para garantir isolation de tenant
 * 
 * @param req Express Request (deve ter connection, organizationId, dbStrategy injetados pelo middleware)
 * @param allowCrossTenant Permitir acesso cross-tenant (apenas para SUPER_ADMIN)
 * @returns PrismaTenantWrapper ou PrismaClient
 * 
 * @example
 * // Em um service:
 * const prisma = getTenantPrisma(req);
 * const users = await prisma.user.findMany();
 */
export function getTenantPrisma(
  req?: Request,
  allowCrossTenant: boolean = false
): PrismaTenantWrapper | PrismaClient {
  // Se não há request, retornar Prisma padrão (para scripts, migrations, etc)
  if (!req) {
    return getPrismaClient();
  }

  // Verificar se tenant context foi injetado pelo middleware
  const connection = (req as any).connection as PrismaClient | undefined;
  const organizationId = (req as any).organizationId as string | undefined;
  const dbStrategy = (req as any).dbStrategy as DbStrategy | undefined;

  // Se tenant context está disponível, usar wrapper
  if (connection && organizationId && dbStrategy) {
    return new PrismaTenantWrapper(
      connection,
      organizationId,
      dbStrategy,
      allowCrossTenant
    );
  }

  // Fallback: usar Prisma padrão (com risco de não ter tenant isolation)
  // Isso pode acontecer em rotas públicas ou que não passam pelo middleware
  // Usar logger.debug para reduzir ruído - apenas logar em modo debug
  logger.debug('getTenantPrisma: Tenant context not found in request. Using default PrismaClient without tenant isolation.');
  
  return getPrismaClient();
}

/**
 * Obtém apenas o PrismaClient do request (sem wrapper)
 * Útil quando você precisa do PrismaClient bruto para operações especiais
 */
export function getRawPrisma(req?: Request): PrismaClient {
  if (!req) {
    return getPrismaClient();
  }

  const connection = (req as any).connection as PrismaClient | undefined;
  
  if (connection) {
    return connection;
  }

  return getPrismaClient();
}















