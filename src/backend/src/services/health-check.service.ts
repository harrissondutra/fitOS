import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { ConnectionManagerService, connectionManager } from './connection-manager.service';

export interface HealthStatus {
  organizationId: string;
  strategy: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency?: number;
  lastCheck: Date;
  errors?: string[];
}

/**
 * Health Check Service
 * Verifica saúde de conexões e databases
 */
export class HealthCheckService {
  private prisma: PrismaClient;
  private connectionManager: ConnectionManagerService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthStatus: Map<string, HealthStatus> = new Map();

  constructor() {
    this.prisma = getPrismaClient();
    this.connectionManager = connectionManager;
    logger.info('HealthCheckService initialized');
  }

  /**
   * Inicia verificações periódicas de saúde
   */
  startHealthChecks(intervalMinutes: number = 5): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkAllHealth();
      } catch (error) {
        logger.error('Error during health checks:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Verificar imediatamente
    this.checkAllHealth().catch(err => {
      logger.error('Error during initial health check:', err);
    });

    logger.info(`Started health checks (interval: ${intervalMinutes} minutes)`);
  }

  /**
   * Para verificações de saúde
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info('Stopped health checks');
    }
  }

  /**
   * Verifica saúde de todas as organizações
   */
  async checkAllHealth(): Promise<void> {
    const tenants = await this.prisma.tenant.findMany({
      where: { status: 'active' },
      select: { id: true, dbStrategy: true },
    });

    const checkPromises = tenants.map(tenant =>
      this.checkOrganizationHealth(tenant.id, tenant.dbStrategy).catch(err => {
        logger.error(`Error checking health for organization ${tenant.id}:`, err);
      })
    );

    await Promise.allSettled(checkPromises);
  }

  /**
   * Verifica saúde de uma organização específica
   */
  async checkOrganizationHealth(organizationId: string, strategy: string): Promise<HealthStatus> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      const prisma = await this.connectionManager.getConnection(organizationId);

      // Query simples para verificar conectividade
      await prisma.$queryRaw`SELECT 1`;

      // Verificar latência
      const latency = Date.now() - startTime;

      // Verificar se latência está dentro do esperado
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
      if (latency > 1000) {
        status = 'unhealthy';
        errors.push(`High latency: ${latency}ms`);
      } else if (latency > 500) {
        status = 'degraded';
        errors.push(`Elevated latency: ${latency}ms`);
      }

      const healthStatus: HealthStatus = {
        organizationId,
        strategy,
        status,
        latency,
        lastCheck: new Date(),
        errors: errors.length > 0 ? errors : undefined,
      };

      this.healthStatus.set(organizationId, healthStatus);

      // Atualizar lastHealthCheckAt na conexão se houver
      await this.prisma.databaseConnection.updateMany({
        where: { organizationId },
        data: { lastHealthCheckAt: new Date() },
      });

      logger.debug(`Health check completed for ${organizationId}: ${status} (${latency}ms)`);
      return healthStatus;
    } catch (error) {
      const latency = Date.now() - startTime;
      errors.push(error instanceof Error ? error.message : String(error));

      const healthStatus: HealthStatus = {
        organizationId,
        strategy,
        status: 'unhealthy',
        latency,
        lastCheck: new Date(),
        errors,
      };

      this.healthStatus.set(organizationId, healthStatus);
      logger.error(`Health check failed for ${organizationId}:`, error);
      return healthStatus;
    }
  }

  /**
   * Obtém status de saúde de uma organização
   */
  getHealthStatus(organizationId: string): HealthStatus | null {
    return this.healthStatus.get(organizationId) || null;
  }

  /**
   * Obtém status de saúde de todas as organizações
   */
  getAllHealthStatuses(): Map<string, HealthStatus> {
    return new Map(this.healthStatus);
  }

  /**
   * Obtém organizações com problemas de saúde
   */
  getUnhealthyOrganizations(): HealthStatus[] {
    return Array.from(this.healthStatus.values()).filter(
      status => status.status !== 'healthy'
    );
  }
}
















