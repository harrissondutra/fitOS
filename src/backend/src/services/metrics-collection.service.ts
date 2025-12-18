import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { ConnectionManagerService, connectionManager } from './connection-manager.service';

/**
 * Metrics Collection Service
 * Coleta métricas de performance e uso por organização
 */
export class MetricsCollectionService {
  // Usar diretamente o singleton, sem lazy getter para evitar múltiplas instâncias
  private get prisma() {
    return getPrismaClient();
  }
  private connectionManager: ConnectionManagerService;
  private collectionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connectionManager = connectionManager;
    logger.info('MetricsCollectionService initialized');
  }

  private async withPrismaRetry<T>(op: () => Promise<T>, retries = 3, operationName?: string, timeoutMs: number = 30000): Promise<T> {
    let lastErr: any;
    for (let i = 1; i <= retries; i++) {
      try {
        // Timeout configurável (padrão 30s para métricas que podem ser lentas)
        return await this.runWithTimeout(op(), timeoutMs);
      } catch (e: any) {
        const code = e?.code || e?.meta?.code;
        const message = e?.message || '';
        const isTransient = code === 'P1017' /* server closed */ || code === 'P2024' /* pool timeout */;
        const isUnreachable = code === 'P1001';

        // P1017: Server closed connection - não desconectar/reconectar singleton
        // O singleton já gerencia as conexões automaticamente
        if (code === 'P1017' && i < retries) {
          logger.warn(`Prisma connection closed (P1017)${operationName ? ` in ${operationName}` : ''}, retrying... Attempt ${i}/${retries}`);

          // Aguardar antes de retry (sem desconectar/reconectar)
          await new Promise(r => setTimeout(r, 300 * i));
          lastErr = e;
          continue;
        }

        if ((isTransient || isUnreachable) && i < retries) {
          const backoff = 200 * i + Math.floor(Math.random() * 100);
          logger.warn(`Retrying Prisma op${operationName ? ` (${operationName})` : ''} due to ${code} (attempt ${i + 1}/${retries}) after ${backoff}ms`);
          await new Promise(r => setTimeout(r, backoff));
          lastErr = e; continue;
        }
        throw e;
      }
    }
    throw lastErr;
  }

  private async runWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
    try {
      // @ts-ignore - timeoutId surely assigned before race settles
      return await Promise.race([promise, timeout]);
    } finally {
      // @ts-ignore
      clearTimeout(timeoutId);
    }
  }

  /**
   * Inicia coleta automática de métricas
   */
  startAutoCollection(intervalMinutes: number = 5): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    this.collectionInterval = setInterval(async () => {
      try {
        await this.collectAllMetrics();
      } catch (error) {
        logger.error('Error during automatic metrics collection:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Coletar após delay inicial para garantir que o banco esteja pronto (30 segundos)
    setTimeout(() => {
      this.collectAllMetrics().catch(err => {
        // Log apenas como warning, não como error, para não bloquear inicialização
        logger.warn('Initial metrics collection failed (will retry on next interval):', err.message);
      });
    }, 30000); // 30 segundos de delay

    logger.info(`Started automatic metrics collection (interval: ${intervalMinutes} minutes, initial delay: 30s)`);
  }

  /**
   * Para coleta automática
   */
  stopAutoCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      logger.info('Stopped automatic metrics collection');
    }
  }

  /**
   * Coleta métricas para todas as organizações
   */
  async collectAllMetrics(): Promise<void> {
    logger.debug('Starting metrics collection for all organizations...');

    const tenants = await this.withPrismaRetry(() => this.prisma.tenant.findMany({
      where: { status: 'active' },
      select: { id: true, dbStrategy: true },
    }), 3, 'tenant.findMany');

    // Limitar concorrência para não exaurir pool de conexões (dev: 2, prod: 5)
    // Reduzido para evitar timeouts quando há muitas organizações
    const isDev = process.env.NODE_ENV !== 'production';
    const concurrency = isDev ? 2 : 5;
    let idx = 0;
    let successCount = 0;
    let errorCount = 0;

    while (idx < tenants.length) {
      const batch = tenants.slice(idx, idx + concurrency);
      const results = await Promise.allSettled(
        batch.map(t => this.collectOrganizationMetrics(t.id, t.dbStrategy))
      );

      // Contar sucessos e erros
      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          errorCount++;
          const tenant = batch[i];
          const errorMsg = result.reason?.message || result.reason || 'Unknown error';
          // Log apenas como warn para reduzir ruído nos logs
          logger.warn(`Skipped metrics collection for organization ${tenant.id}: ${errorMsg}`);
        }
      });

      idx += concurrency;

      // Pequeno delay entre batches para não sobrecarregar o banco
      if (idx < tenants.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    logger.info(`Completed metrics collection: ${successCount} success, ${errorCount} errors out of ${tenants.length} organizations`);
  }

  /**
   * Coleta métricas para uma organização específica
   */
  async collectOrganizationMetrics(
    organizationId: string,
    dbStrategy: string
  ): Promise<void> {
    try {
      const prisma = await this.connectionManager.getConnection(organizationId);

      // Coletar métricas baseadas na estratégia
      let metrics: {
        storageUsedBytes: bigint;
        connectionsActive: number;
        queryAvgTimeMs: number | null;
        cpuUsagePercent: number | null;
        memoryUsagePercent: number | null;
      };

      // Coletar métricas (timeout já gerenciado internamente)
      if (dbStrategy === 'row_level') {
        metrics = await this.collectRowLevelMetrics(prisma, organizationId);
      } else if (dbStrategy === 'schema_level') {
        metrics = await this.collectSchemaLevelMetrics(prisma, organizationId);
      } else {
        metrics = await this.collectDatabaseLevelMetrics(prisma, organizationId);
      }

      // Buscar connection_id se houver (com timeout curto pois é query simples)
      const connection = await this.withPrismaRetry(
        () => this.prisma.databaseConnection.findFirst({
          where: { organizationId },
          select: { id: true },
        }),
        2,
        'databaseConnection.findFirst',
        5000 // Query simples, timeout curto
      );

      // Salvar métricas (timeout curto pois é insert simples)
      await this.withPrismaRetry(
        () => this.prisma.databaseMetric.create({
          data: {
            organizationId,
            databaseConnectionId: connection?.id || null,
            storageUsedBytes: metrics.storageUsedBytes,
            connectionsActive: metrics.connectionsActive,
            queryAvgTimeMs: metrics.queryAvgTimeMs,
            cpuUsagePercent: metrics.cpuUsagePercent,
            memoryUsagePercent: metrics.memoryUsagePercent,
            recordedAt: new Date(),
          },
        }),
        2,
        'databaseMetric.create',
        5000
      );

      // Atualizar storage no tenant (timeout curto pois é update simples)
      await this.withPrismaRetry(
        () => this.prisma.tenant.update({
          where: { id: organizationId },
          data: {
            storageUsageBytes: metrics.storageUsedBytes,
            connectionCount: metrics.connectionsActive,
          },
        }),
        2,
        'tenant.update',
        5000
      );

      logger.debug(`Metrics collected for organization ${organizationId}`);
    } catch (error: any) {
      const code = error?.code || error?.meta?.code;
      const isTimeout = error?.message?.includes('timeout') || error?.message?.includes('timed out');
      const isPoolExhausted = /too many clients|connection pool/i.test(error?.message || '');

      // P1001: banco do core fora do ar → logar warn para reduzir ruído
      // Timeout: operação demorou muito mas não é crítico, apenas logar como warn
      if (code === 'P1001') {
        logger.warn(`Core database unreachable while saving metrics for ${organizationId} (P1001). Skipping.`);
        return;
      }

      if (isTimeout) {
        logger.warn(`Metrics collection timeout for organization ${organizationId}. Skipping this cycle.`);
        // Registrar cooldown global curto para evitar avalanche de timeouts
        this.lastCooldownAt = Date.now();
        return; // Não lançar erro para não interromper coleta de outras organizações
      }

      if (isPoolExhausted) {
        logger.warn(`Metrics collection skipped due to pool saturation for ${organizationId}. Applying short cooldown.`);
        this.lastCooldownAt = Date.now();
        return;
      }

      // Para outros erros, logar mas não lançar para não interromper outras coletas
      logger.error(`Error collecting metrics for organization ${organizationId}:`, error);
      return; // Continuar com próxima organização ao invés de lançar erro
    }
  }

  // Cooldown simples para reduzir pressão em caso de timeouts/estouro de pool
  private lastCooldownAt: number | null = null;

  private inCooldown(): boolean {
    if (!this.lastCooldownAt) return false;
    const COOLDOWN_MS = 30_000; // 30s
    return Date.now() - this.lastCooldownAt < COOLDOWN_MS;
  }

  /**
   * Coleta métricas para row-level
   */
  private async collectRowLevelMetrics(prisma: any, organizationId: string): Promise<any> {
    try {
      // Calcular storage usado (tamanho de todas as tabelas do tenant)
      // Usar query mais eficiente que evita calcular tamanho total (inclui índices) para todas as tabelas
      // Em vez disso, usar uma aproximação mais rápida
      const storageResult = await this.withPrismaRetry(
        () => prisma.$queryRaw<Array<{ total_bytes: bigint }>>`
        SELECT COALESCE(SUM(pg_relation_size(oid)), 0)::bigint as total_bytes
        FROM pg_class
        WHERE relkind = 'r'
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'fitos')
        `,
        1, // Apenas 1 tentativa para evitar acumular timeouts
        'collectRowLevelMetrics',
        15000 // Timeout reduzido (pg_relation_size é mais rápido que pg_total_relation_size)
      );

      const storageUsedBytes = storageResult[0]?.total_bytes || BigInt(0);

      // Contar conexões ativas (simplificado - usar pg_stat_activity se possível)
      const connectionsActive = 1; // A conexão atual do Prisma

      // Query avg time (usar pg_stat_statements se disponível, senão estimar)
      const queryAvgTimeMs = null; // TODO: Implementar se pg_stat_statements estiver ativo

      return {
        storageUsedBytes,
        connectionsActive,
        queryAvgTimeMs,
        cpuUsagePercent: null, // Não disponível diretamente
        memoryUsagePercent: null, // Não disponível diretamente
      };
    } catch (e: any) {
      const code = e?.code || e?.meta?.code;
      const isTimeout = e?.message?.includes('timeout') || e?.message?.includes('timed out');

      // Se timeout ou database unreachable, retornar valores padrão sem falhar
      if (code === 'P1001' || isTimeout) {
        logger.warn(`Metrics collection skipped for ${organizationId}: ${isTimeout ? 'timeout' : 'database unreachable (P1001)'}`);
        return {
          storageUsedBytes: BigInt(0),
          connectionsActive: 0,
          queryAvgTimeMs: null,
          cpuUsagePercent: null,
          memoryUsagePercent: null,
        };
      }
      throw e;
    }
  }

  /**
   * Coleta métricas para schema-level
   */
  private async collectSchemaLevelMetrics(prisma: any, organizationId: string): Promise<any> {
    try {
      const schemaName = `tenant_${organizationId.replace(/-/g, '_')}`;

      // Storage usado pelo schema específico (usar pg_relation_size para ser mais rápido)
      const storageResult = await this.withPrismaRetry(
        () => prisma.$queryRaw<Array<{ total_bytes: bigint }>>`
          SELECT COALESCE(SUM(pg_relation_size(oid)), 0)::bigint as total_bytes
      FROM pg_class
      WHERE relkind = 'r'
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = ${schemaName})
        `,
        1,
        'collectSchemaLevelMetrics',
        15000
      );

      const storageUsedBytes = storageResult[0]?.total_bytes || BigInt(0);
      const connectionsActive = 1;

      return {
        storageUsedBytes,
        connectionsActive,
        queryAvgTimeMs: null,
        cpuUsagePercent: null,
        memoryUsagePercent: null,
      };
    } catch (e: any) {
      const isTimeout = e?.message?.includes('timeout') || e?.message?.includes('timed out');
      if (isTimeout) {
        logger.warn(`Schema-level metrics collection timeout for ${organizationId}`);
        return {
          storageUsedBytes: BigInt(0),
          connectionsActive: 0,
          queryAvgTimeMs: null,
          cpuUsagePercent: null,
          memoryUsagePercent: null,
        };
      }
      throw e;
    }
  }

  /**
   * Coleta métricas para database-level
   */
  private async collectDatabaseLevelMetrics(prisma: any, organizationId: string): Promise<any> {
    try {
      // Para database-level, podemos acessar pg_database_size (mais rápido que somar tabelas)
      const storageResult = await this.withPrismaRetry(
        () => prisma.$queryRaw<Array<{ size_bytes: bigint }>>`
      SELECT pg_database_size(current_database()) as size_bytes
        `,
        2,
        'collectDatabaseLevelMetrics',
        20000 // pg_database_size é mais rápido, pode ter timeout menor
      );

      const storageUsedBytes = storageResult[0]?.size_bytes || BigInt(0);
      const connectionsActive = 1;

      return {
        storageUsedBytes,
        connectionsActive,
        queryAvgTimeMs: null,
        cpuUsagePercent: null,
        memoryUsagePercent: null,
      };
    } catch (e: any) {
      const isTimeout = e?.message?.includes('timeout') || e?.message?.includes('timed out');
      if (isTimeout) {
        logger.warn(`Database-level metrics collection timeout for ${organizationId}`);
        return {
          storageUsedBytes: BigInt(0),
          connectionsActive: 0,
          queryAvgTimeMs: null,
          cpuUsagePercent: null,
          memoryUsagePercent: null,
        };
      }
      throw e;
    }
  }

  /**
   * Obtém métricas recentes de uma organização
   */
  async getOrganizationMetrics(
    organizationId: string,
    hours: number = 24
  ): Promise<any[]> {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    return await this.prisma.databaseMetric.findMany({
      where: {
        organizationId,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'desc' },
    });
  }

  /**
   * Obtém métricas agregadas de todas as organizações
   */
  async getAggregatedMetrics(): Promise<any> {
    const metrics = await this.prisma.databaseMetric.findMany({
      where: {
        recordedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
        },
      },
      orderBy: { recordedAt: 'desc' },
    });

    // Agregar por organização (última métrica de cada uma)
    const latestByOrg = new Map();
    for (const metric of metrics) {
      if (!latestByOrg.has(metric.organizationId)) {
        latestByOrg.set(metric.organizationId, metric);
      }
    }

    const totalStorage = Array.from(latestByOrg.values()).reduce(
      (sum, m) => sum + Number(m.storageUsedBytes),
      0
    );

    const totalConnections = Array.from(latestByOrg.values()).reduce(
      (sum, m) => sum + m.connectionsActive,
      0
    );

    return {
      totalOrganizations: latestByOrg.size,
      totalStorageBytes: totalStorage,
      totalConnections,
      averageQueryTimeMs: null, // Agregar se disponível
    };
  }
}

