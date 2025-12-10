import { serializeBigInt } from '../utils/bigint-serializer';
import { Router, Request, Response } from 'express';
import { getRedisClient } from '../config/redis';
import { OrganizationService } from '../services/organization.service';
import { BackupService } from '../services/backup.service';
import { MigrationOrchestratorService } from '../services/migration-orchestrator.service';
import { MetricsCollectionService } from '../services/metrics-collection.service';
import { AlertingService } from '../services/alerting.service';
import { HealthCheckService } from '../services/health-check.service';
import { ConnectionManagerService } from '../services/connection-manager.service';
import { ServerScanAutomationService } from '../services/server-scan-automation.service';
import { ProviderIntegrationService } from '../services/provider-integration.service';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role-based-access.middleware';
import { requireSuperAdmin } from '../middleware/superAdmin';
import { EncryptionService } from '../services/encryption.service';

const router = Router();
// Helper simples de retry para chamadas Prisma do poller
async function withPrismaRetry<T>(op: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: any;
  for (let i = 1; i <= retries; i++) {
    try { return await op(); } catch (e: any) {
      const code = e?.code || e?.meta?.code;
      // P1017 (conexão fechada) e P2024 (pool timeout) → retry com backoff curto
      if ((code === 'P1017' || code === 'P2024') && i < retries) {
        await new Promise(r => setTimeout(r, 200 * i));
        lastErr = e; continue;
      }
      throw e;
    }
  }
  throw lastErr;
}
// Background poller for server metrics (uses stored encrypted SSH key in Redis)
let pollerStarted = false;
async function startServerMetricsPoller(): Promise<void> {
  if (pollerStarted) return;
  pollerStarted = true;
  const seconds = Number(process.env.SERVER_METRICS_POLL_SECONDS || 120);
  if (!seconds || Number.isNaN(seconds) || seconds < 30) {
    logger.info('Server metrics poller disabled or below min interval');
    return;
  }
  logger.info(`Starting server metrics poller (interval ${seconds}s)`);
  setInterval(async () => {
    try {
      const prisma = getPrismaClient();
      const servers = await withPrismaRetry(() => prisma.databaseConnection.findMany({
        where: { databaseName: '__server__', status: 'active' },
        select: { id: true, host: true, port: true, username: true },
      }));
      const { ProviderIntegrationService } = await import('../services/provider-integration.service');
      const providerService = new ProviderIntegrationService();
      const { EncryptionService } = await import('../services/encryption.service');
      const enc = new EncryptionService();
      for (const s of servers) {
        const stored = await rgetServerSSHKey(s.id);
        if (!stored) continue;
        let privateKey: string | null = null;
        try { privateKey = enc.decrypt(stored); } catch { privateKey = null; }
        if (!privateKey) continue;
        try {
          const stats = await providerService.getServerHealthViaSSH({ sshHost: s.host, sshPort: s.port || 22, sshUsername: s.username || 'root', sshKey: privateKey });
          const payload = { ts: Date.now(), data: stats };
          pushServerMetric(s.id, stats);
          await rpushServerMetric(s.id, payload);
        } catch (e) {
          logger.warn(`Server poller failed for ${s.id}`, { error: e instanceof Error ? e.message : String(e) });
        }
      }
    } catch (err) {
      logger.error('Server metrics poller loop error:', err);
    }
  }, seconds * 1000);
}

// Start poller lazily on first import
startServerMetricsPoller().catch(() => {});
// In-memory server metrics history (runtime persistence)
const serverMetricsHistory: Map<string, Array<{ ts: number; data: any }>> = new Map();
const pushServerMetric = (serverId: string, data: any, max: number = 500) => {
  const arr = serverMetricsHistory.get(serverId) || [];
  arr.push({ ts: Date.now(), data });
  while (arr.length > max) arr.shift();
  serverMetricsHistory.set(serverId, arr);
};

// Durable persistence via Redis
let redisClient: any | null = null;
function getRedis(): any | null {
  try {
    if (!redisClient) {
      const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL; // suporte comum
      if (!url) return null;
      // Usar cliente central para garantir handlers
      redisClient = getRedisClient();
    }
    return redisClient;
  } catch {
    return null;
  }
}
const REDIS_KEY = (serverId: string) => `fitos:servers:metrics:${serverId}`;
const REDIS_KEY_SSH = (serverId: string) => `fitos:servers:sshkey:${serverId}`;
const getMetricsTTLSeconds = (): number | null => {
  const days = Number(process.env.REDIS_SERVER_METRICS_TTL_DAYS || 0);
  if (!days || Number.isNaN(days) || days <= 0) return null;
  return Math.floor(days * 24 * 60 * 60);
};
async function rpushServerMetric(serverId: string, payload: { ts: number; data: any }, max: number = 1000): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const key = REDIS_KEY(serverId);
  try {
    await r.lpush(key, JSON.stringify(payload));
    await r.ltrim(key, 0, max - 1);
    const ttl = getMetricsTTLSeconds();
    if (ttl) {
      await r.expire(key, ttl);
    }
  } catch {}
}
async function rgetServerMetrics(serverId: string, limit: number = 200): Promise<Array<{ ts: number; data: any }>> {
  const r = getRedis();
  if (!r) return [];
  const key = REDIS_KEY(serverId);
  try {
    const arr = await r.lrange(key, 0, Math.max(0, limit - 1));
    return arr.map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
  } catch {
    return [];
  }
}

// Store/get encrypted SSH key per server
async function rsetServerSSHKey(serverId: string, encryptedKey: string, ttlDays?: number): Promise<void> {
  const r = getRedis();
  if (!r) return;
  const key = REDIS_KEY_SSH(serverId);
  await r.set(key, encryptedKey);
  if (ttlDays && ttlDays > 0) {
    await r.expire(key, Math.floor(ttlDays * 24 * 60 * 60));
  }
}
async function rdelServerSSHKey(serverId: string): Promise<void> {
  const r = getRedis();
  if (!r) return;
  await r.del(REDIS_KEY_SSH(serverId));
}
async function rgetServerSSHKey(serverId: string): Promise<string | null> {
  const r = getRedis();
  if (!r) return null;
  return await r.get(REDIS_KEY_SSH(serverId));
}

// Inicializar serviços
const organizationService = new OrganizationService();
const backupService = new BackupService();
const migrationService = new MigrationOrchestratorService();
const metricsService = new MetricsCollectionService();
const alertingService = new AlertingService();
const healthCheckService = new HealthCheckService();
const connectionManager = new ConnectionManagerService();
const encryptionService = new EncryptionService();
const serverScanService = new ServerScanAutomationService();

// Middleware: Requer SUPER_ADMIN para todas as rotas (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  authMiddleware.requireAuth()(req, res, next);
});
router.use(requireSuperAdmin);

// ============================================
// Organizations Routes
// ============================================

/**
 * GET /api/admin/organizations
 * Listar todas as organizações
 */
router.get('/organizations', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { page = 1, limit = 20, search, planType, dbStrategy } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { subdomain: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (planType) where.planType = planType;
    if (dbStrategy) where.dbStrategy = dbStrategy;

    const prisma = getPrismaClient();
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              databaseConnections: true,
              backupHistory: true,
              migrationJobs: true,
            },
          },
        },
      }),
      prisma.tenant.count({ where }),
    ]);

    res.json({
      success: true,
      data: serializeBigInt({
        items: tenants,
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: Number(page) * Number(limit) < total,
      }),
    });
  } catch (error) {
    logger.error('Error listing organizations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/organizations/:id
 * Detalhes de uma organização
 */
router.get('/organizations/:id', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        databaseConnections: true,
        databaseMetrics: {
          take: 10,
          orderBy: { recordedAt: 'desc' },
        },
        backupHistory: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
        migrationJobs: {
          take: 10,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    // Adicionar métricas agregadas
    const metrics = await metricsService.getOrganizationMetrics(id, 24);

    res.json({
      success: true,
      data: serializeBigInt({
        ...tenant,
        metrics: {
          recent: metrics,
          health: healthCheckService.getHealthStatus(id),
        },
      }),
    });
  } catch (error) {
    logger.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * PUT /api/admin/organizations/:id
 * Atualizar organização
 */
router.put('/organizations/:id', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    const { name, subdomain, customDomain, settings } = req.body;

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(subdomain && { subdomain }),
        ...(customDomain && { customDomain }),
        ...(settings && { settings }),
      },
    });

    res.json({
      success: true,
      data: serializeBigInt(updated),
      message: 'Organization updated successfully',
    });
  } catch (error) {
    logger.error('Error updating organization:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/organizations/:id/upgrade-plan
 * Upgrade/downgrade de plano
 */
router.post('/organizations/:id/upgrade-plan', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPlanType, createBackup } = req.body;

    if (!newPlanType) {
      return res.status(400).json({
        success: false,
        error: 'newPlanType is required',
      });
    }

    const updated = await organizationService.upgradeOrganizationPlan(id, {
      newPlanType,
      createBackup: createBackup !== false,
    });

    res.json({
      success: true,
      data: serializeBigInt(updated),
      message: 'Plan upgraded successfully',
    });
  } catch (error) {
    logger.error('Error upgrading plan:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/organizations/:id/migrate
 * Iniciar migração de estratégia
 */
router.post('/organizations/:id/migrate', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    const { toStrategy } = req.body;

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      select: { dbStrategy: true },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found',
      });
    }

    if (!toStrategy) {
      return res.status(400).json({
        success: false,
        error: 'toStrategy is required',
      });
    }

    const migrationJobId = await migrationService.migrateOrganization(
      id,
      tenant.dbStrategy,
      toStrategy
    );

    res.json({
      success: true,
      data: { migrationJobId },
      message: 'Migration started',
    });
  } catch (error) {
    logger.error('Error starting migration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Database Connections Routes
// ============================================

/**
 * GET /api/admin/database-connections
 * Listar conexões de banco
 */
router.get('/database-connections', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { organizationId } = req.query;

    const connections = await prisma.databaseConnection.findMany({
      where: organizationId ? { organizationId: organizationId as string } : undefined,
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: connections,
    });
  } catch (error) {
    logger.error('Error listing database connections:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/database-connections
 * Criar nova conexão
 */
router.post('/database-connections', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const {
      organizationId,
      name,
      provider,
      host,
      port,
      databaseName,
      username,
      password,
      sshEnabled,
      sshHost,
      sshPort,
      sshUsername,
      sshKey,
      sslEnabled,
      connectionPoolSize,
    } = req.body;

    // Criptografar senha e SSH key antes de salvar
    const encryptedPassword = password ? encryptionService.encrypt(password) : null;
    const encryptedSshKey = sshKey ? encryptionService.encrypt(sshKey) : null;

    const connection = await prisma.databaseConnection.create({
      data: {
        organizationId,
        name,
        provider,
        host,
        port: port || 5432,
        databaseName,
        username,
        encryptedPassword,
        sshEnabled: sshEnabled || false,
        sshHost,
        sshPort: sshPort || 22,
        sshUsername,
        encryptedSshKey,
        sslEnabled: sslEnabled || false,
        connectionPoolSize: connectionPoolSize || 10,
        status: 'active',
      },
    });

    res.status(201).json({
      success: true,
      data: connection,
      message: 'Database connection created successfully',
    });
  } catch (error) {
    logger.error('Error creating database connection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/database-connections/:id/test
 * Testar conexão
 */
router.post('/database-connections/:id/test', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;

    const connection = await prisma.databaseConnection.findUnique({
      where: { id },
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found',
      });
    }

    // Tentar conectar usando ConnectionManager
    const testPrisma = await connectionManager.getConnection(connection.organizationId);

    // Query simples de teste
    await testPrisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: 'Connection test successful',
    });
  } catch (error) {
    logger.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    });
  }
});

// ============================================
// Backups Routes
// ============================================

/**
 * GET /api/admin/backups
 * Listar backups
 */
router.get('/backups', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { organizationId, status } = req.query;

    const backups = await prisma.backupHistory.findMany({
      where: {
        ...(organizationId && { organizationId: organizationId as string }),
        ...(status && { status: status as any }),
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      data: backups,
    });
  } catch (error) {
    logger.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/backups
 * Criar backup manual
 */
router.post('/backups', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { organizationId, type, storageProvider } = req.body;

    if (!organizationId || !type || !storageProvider) {
      return res.status(400).json({
        success: false,
        error: 'organizationId, type, and storageProvider are required',
      });
    }

    const backupId = await backupService.createBackup(
      organizationId,
      type,
      storageProvider
    );

    res.status(201).json({
      success: true,
      data: { backupId },
      message: 'Backup created successfully',
    });
  } catch (error) {
    logger.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/backups/:id/restore
 * Restaurar backup
 */
router.post('/backups/:id/restore', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    const { targetOrganizationId } = req.body;

    await backupService.restoreBackup(id, targetOrganizationId);

    res.json({
      success: true,
      message: 'Backup restored successfully',
    });
  } catch (error) {
    logger.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Migrations Routes
// ============================================

/**
 * GET /api/admin/migrations
 * Listar migrações
 */
router.get('/migrations', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { organizationId, status } = req.query;

    const migrations = await prisma.migrationJob.findMany({
      where: {
        ...(organizationId && { organizationId: organizationId as string }),
        ...(status && { status: status as any }),
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 100,
    });

    res.json({
      success: true,
      data: migrations,
    });
  } catch (error) {
    logger.error('Error listing migrations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/migrations/:id
 * Detalhes de uma migração
 */
router.get('/migrations/:id', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;

    const migration = await prisma.migrationJob.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found',
      });
    }

    res.json({
      success: true,
      data: migration,
    });
  } catch (error) {
    logger.error('Error fetching migration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Metrics Routes
// ============================================

/**
 * GET /api/admin/metrics
 * Métricas agregadas
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const aggregated = await metricsService.getAggregatedMetrics();
    res.json({
      success: true,
      data: aggregated,
    });
  } catch (error) {
    logger.error('Error fetching aggregated metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/metrics/:organizationId
 * Métricas de uma organização
 */
router.get('/metrics/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { hours } = req.query;

    const metrics = await metricsService.getOrganizationMetrics(
      organizationId,
      Number(hours) || 24
    );

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Error fetching organization metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/metrics/aggregated
 * Métricas agregadas para dashboard
 */
router.get('/metrics/aggregated', async (req: Request, res: Response) => {
  try {
    const aggregated = await metricsService.getAggregatedMetrics();
    res.json({
      success: true,
      data: aggregated,
    });
  } catch (error) {
    logger.error('Error fetching aggregated metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Migration Control Routes
// ============================================

/**
 * POST /api/admin/migrations/:id/pause
 * Pausar migração
 */
router.post('/migrations/:id/pause', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    
    const migration = await prisma.migrationJob.findUnique({
      where: { id },
    });

    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found',
      });
    }

    if (migration.status !== 'running') {
      return res.status(400).json({
        success: false,
        error: `Cannot pause migration with status: ${migration.status}`,
      });
    }

    await prisma.migrationJob.update({
      where: { id },
      data: { status: 'pending' },
    });

    res.json({
      success: true,
      message: 'Migration paused successfully',
    });
  } catch (error) {
    logger.error('Error pausing migration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/migrations/:id/resume
 * Retomar migração
 */
router.post('/migrations/:id/resume', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;

    const migration = await prisma.migrationJob.findUnique({
      where: { id },
    });

    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found',
      });
    }

    if (migration.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot resume migration with status: ${migration.status}`,
      });
    }

    await prisma.migrationJob.update({
      where: { id },
      data: { status: 'running', startedAt: new Date() },
    });

    // Retomar migração em background
    migrationService.migrateOrganization(
      migration.organizationId,
      migration.fromStrategy,
      migration.toStrategy
    ).catch(err => {
      logger.error('Error resuming migration:', err);
    });

    res.json({
      success: true,
      message: 'Migration resumed successfully',
    });
  } catch (error) {
    logger.error('Error resuming migration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/migrations/:id/rollback
 * Fazer rollback de migração
 */
router.post('/migrations/:id/rollback', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;

    const migration = await prisma.migrationJob.findUnique({
      where: { id },
      include: {},
    });

    if (!migration) {
      return res.status(404).json({
        success: false,
        error: 'Migration not found',
      });
    }

    if (!migration.backupId) {
      return res.status(400).json({
        success: false,
        error: 'No backup found for rollback',
      });
    }

    await prisma.migrationJob.update({
      where: { id },
      data: { status: 'running', currentStep: 'Rolling back...' },
    });

    // Restaurar backup
    await backupService.restoreBackup(migration.backupId, migration.organizationId);

    await prisma.migrationJob.update({
      where: { id },
      data: {
        status: 'rolled_back',
        completedAt: new Date(),
        progressPercent: 100,
        currentStep: 'Rollback completed',
      },
    });

    res.json({
      success: true,
      message: 'Migration rolled back successfully',
    });
  } catch (error) {
    logger.error('Error rolling back migration:', error);
    await prisma.migrationJob.update({
      where: { id: req.params.id },
      data: { status: 'failed', currentStep: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
    });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Dashboard Routes
// ============================================

/**
 * GET /api/admin/database/dashboard
 * Dashboard overview com estatísticas gerais
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
  // Tornar dashboard resiliente a falhas em métricas agregadas
  const [
      totalOrganizations,
      totalConnections,
      totalBackups,
      activeMigrations,
      storageStats,
      strategyDistribution,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.databaseConnection.count(),
      prisma.backupHistory.count(),
      prisma.migrationJob.count({ where: { status: 'running' } }),
      (async () => {
        try { return await metricsService.getAggregatedMetrics(); }
        catch (e: any) {
          const code = e?.code || e?.meta?.code;
          if (code === 'P1001') {
            logger.warn('Aggregated metrics unavailable (P1001). Returning zeros for dashboard.');
            return { totalStorageBytes: 0 } as any;
          }
          return { totalStorageBytes: 0 } as any;
        }
      })(),
      prisma.tenant.groupBy({
        by: ['dbStrategy'],
        _count: { dbStrategy: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        totalOrganizations,
        totalConnections,
        totalBackups,
        activeMigrations,
        storageUsed: storageStats.totalStorageBytes || 0,
        storageLimit: 0, // TODO: Calcular limite total baseado nos planos
        strategyDistribution: strategyDistribution.reduce((acc, item) => {
          acc[item.dbStrategy] = item._count.dbStrategy;
          return acc;
        }, {} as Record<string, number>),
        tenantGrowth: [], // TODO: Implementar getTenantGrowth
      },
    });
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/database/connections
 * Lista conexões de banco salvas
 */
router.get('/connections', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { page = 1, limit = 50, organizationId } = req.query;
    const where: any = {};
    if (organizationId) where.organizationId = String(organizationId);
    const [items, total] = await Promise.all([
      prisma.databaseConnection.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          organizationId: true,
          name: true,
          provider: true,
          host: true,
          port: true,
          databaseName: true,
          username: true,
          sslEnabled: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.databaseConnection.count({ where }),
    ]);
    res.json({ 
      success: true, 
      data: serializeBigInt({ 
        items, 
        total, 
        page: Number(page), 
        limit: Number(limit), 
        hasMore: Number(page) * Number(limit) < total 
      }) 
    });
  } catch (error) {
    logger.error('Error listing database connections:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// ============================================
// Redis Routes (scan/import/test)
// ============================================

/**
 * POST /api/admin/database/redis/test
 * Testar conexão Redis
 */
router.post('/redis/test', async (req: Request, res: Response) => {
  try {
    const { host, port, password, db, tls } = req.body || {};
    if (!host) return res.status(400).json({ success: false, error: 'host é obrigatório' });
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const ok = await providerService.testRedisConnection({ host, port, password, db, tls });
    res.json({ success: ok, data: { status: ok ? 'connected' : 'disconnected' } });
  } catch (error) {
    logger.error('Error testing Redis connection:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * GET /api/admin/database/redis/status
 * Indica se Redis está configurado e acessível (para persistência durável)
 */
router.get('/redis/status', async (req: Request, res: Response) => {
  try {
    const r = getRedis();
    if (!r) return res.json({ success: true, data: { configured: false, ping: null } });
    const ping = await r.ping();
    res.json({ success: true, data: { configured: true, ping } });
  } catch (error) {
    logger.error('Redis status error:', error);
    res.json({ success: true, data: { configured: false, ping: null } });
  }
});

/**
 * Helper para obter dados SSH de um servidor (suporta ambos os formatos)
 */
async function getServerSSHData(id: string) {
  const prisma = getPrismaClient();
  const server = await prisma.databaseConnection.findUnique({ 
    where: { id },
    select: { 
      id: true, 
      host: true, 
      port: true, 
      username: true,
      sshHost: true,
      sshPort: true,
      sshUsername: true,
      databaseName: true,
      sshEnabled: true
    }
  });
  
  if (!server) return null;
  
  // Se é formato novo (databaseName = '__server__'), usar host/port/username
  if (server.databaseName === '__server__') {
    return {
      host: server.host,
      port: server.port || 22,
      username: server.username || 'root',
    };
  }
  
  // Se é formato antigo (sshEnabled = true), usar sshHost/sshPort/sshUsername
  if (server.sshEnabled && server.sshHost && server.sshUsername) {
    return {
      host: server.sshHost,
      port: server.sshPort || 22,
      username: server.sshUsername,
    };
  }
  
  return null;
}

async function getServerSSHKey(id: string): Promise<string | null> {
  const redis = getRedis();
  if (!redis) return null;
  return await redis.get(`fitos:ssh:key:${id}`);
}

/**
 * GET /api/admin/database/servers
 * Lista servidores persistidos (sem chaves)
 * Busca tanto servidores com databaseName='__server__' quanto com sshEnabled=true
 */
router.get('/servers', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    // Buscar servidores em dois formatos:
    // 1. Novo formato: databaseName = '__server__'
    // 2. Formato antigo: sshEnabled = true com campos SSH preenchidos
    const [newFormatServers, oldFormatServers] = await Promise.all([
      prisma.databaseConnection.findMany({
        where: { databaseName: '__server__' },
        select: { 
          id: true, 
          name: true, 
          host: true, 
          port: true, 
          username: true, 
          createdAt: true 
        },
      }),
      prisma.databaseConnection.findMany({
        where: { 
          sshEnabled: true,
          sshHost: { not: null },
          sshUsername: { not: null },
          // Excluir os que já estão no formato novo
          databaseName: { not: '__server__' }
        },
        select: { 
          id: true, 
          name: true, 
          sshHost: true,
          sshPort: true,
          sshUsername: true,
          createdAt: true 
        },
      }),
    ]);

    // Normalizar formato antigo para novo formato
    const normalizedOldFormat = oldFormatServers.map(server => ({
      id: server.id,
      name: server.name,
      host: server.sshHost || '',
      port: server.sshPort || 22,
      username: server.sshUsername || '',
      createdAt: server.createdAt,
    }));

    // Combinar e remover duplicatas (por ID)
    const allServers = [...newFormatServers, ...normalizedOldFormat];
    const uniqueServers = Array.from(
      new Map(allServers.map(server => [server.id, server])).values()
    );

    res.json({ success: true, data: { items: uniqueServers } });
  } catch (error) {
    logger.error('Error listing servers:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/servers
 * Adiciona servidor (nome, host, porta, usuario) sem chave
 */
router.post('/servers', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { name, host, port, username } = req.body || {};
    if (!name || !host || !username) return res.status(400).json({ success: false, error: 'name, host e username são obrigatórios' });
    
    // Garantir que a organização 'sistema' existe
    let sistemaOrg = await prisma.tenant.findUnique({ where: { id: 'sistema' } });
    if (!sistemaOrg) {
      logger.info('Creating sistema organization for SSH servers');
      sistemaOrg = await prisma.tenant.create({
        data: {
          id: 'sistema',
          name: 'Sistema (Servidores SSH)',
          subdomain: 'sistema',
          plan: 'enterprise',
          billingEmail: 'admin@sistema.interno',
          dbStrategy: 'row_level',
          status: 'active',
          storageUsageBytes: BigInt(0),
          connectionCount: 0,
        }
      });
    }
    
    const conn = await prisma.databaseConnection.create({
      data: {
        organizationId: 'sistema',
        name,
        provider: 'custom' as any,
        host,
        port: port || 22,
        databaseName: '__server__',
        username,
        encryptedPassword: '',
        sslEnabled: false,
        connectionPoolSize: 0,
        status: 'active',
      }
    });
    res.status(201).json({ success: true, data: { server: { id: conn.id, name: conn.name, host: conn.host, port: conn.port, username: conn.username } } });
  } catch (error) {
    logger.error('Error creating server:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * PUT /api/admin/database/servers/:id/key
 * Armazena chave privada SSH criptografada para coleta automática
 * body: { privateKey: string, ttlDays?: number }
 */
router.put('/servers/:id/key', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { privateKey, ttlDays } = req.body || {};
    if (!privateKey) return res.status(400).json({ success: false, error: 'privateKey é obrigatório' });
    const { EncryptionService } = await import('../services/encryption.service');
    const enc = new EncryptionService();
    const encrypted = enc.encrypt(privateKey);
    await rsetServerSSHKey(id, encrypted, ttlDays);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error setting server ssh key:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/database/servers/:id/key
 */
router.delete('/servers/:id/key', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await rdelServerSSHKey(id);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting server ssh key:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * GET /api/admin/database/servers/:id/key/status
 */
router.get('/servers/:id/key/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const val = await rgetServerSSHKey(id);
    res.json({ success: true, data: { exists: !!val } });
  } catch (error) {
    logger.error('Error getting server ssh key status:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/database/servers/:id
 */
router.delete('/servers/:id', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    await prisma.databaseConnection.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting server:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/redis/docker/scan
 * Escanear containers Docker de Redis via SSH
 */
router.post('/redis/docker/scan', async (req: Request, res: Response) => {
  try {
    const { sshHost, sshPort, sshUsername, sshKey } = req.body || {};
    if (!sshHost || !sshUsername || !sshKey) {
      return res.status(400).json({ success: false, error: 'sshHost, sshUsername e sshKey são obrigatórios' });
    }
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const containers = await providerService.listDockerRedisContainersViaSSH({ sshHost, sshPort, sshUsername, sshKey });
    return res.json({ success: true, data: { items: containers, total: containers.length } });
  } catch (error) {
    logger.error('Error scanning Redis Docker via SSH:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/redis/docker/import
 * Importar container Redis como conexão (salvar em database_connections com namespace 'redis' se existir tabela separada futuramente)
 */
router.post('/redis/docker/import', async (req: Request, res: Response) => {
  try {
    const { organizationId, name, sshHost, sshPort, sshUsername, sshKey, containerName } = req.body || {};
    if (!organizationId || !name || !sshHost || !sshUsername || !sshKey || !containerName) {
      return res.status(400).json({ success: false, error: 'organizationId, name, sshHost, sshUsername, sshKey e containerName são obrigatórios' });
    }
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const containers = await providerService.listDockerRedisContainersViaSSH({ sshHost, sshPort, sshUsername, sshKey });
    const match = containers.find(c => c.containerName === containerName);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Container não encontrado' });
    }
    if (!match.hostPort) {
      return res.status(400).json({ success: false, error: 'Container sem porta mapeada no host (6379). Exponha a porta para importar.' });
    }

    // Por enquanto, retornamos somente os dados detectados (persistência em tabela própria de Redis pode ser adicionada)
    res.status(201).json({ success: true, data: { connection: { organizationId, name, host: match.host, port: match.hostPort, password: !!match.password } }, message: 'Redis import detectado (persistência pendente de schema próprio)' });
  } catch (error) {
    logger.error('Error importing Redis Docker as connection:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// ============================================
// Server-bound Docker scan/import (uses stored SSH key)
// ============================================

/**
 * POST /api/admin/database/servers/:id/docker/scan
 * Usa host/port/username do servidor e chave SSH armazenada para escanear Postgres e Redis containers
 */
router.post('/servers/:id/docker/scan', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    const sshData = await getServerSSHData(id);
    if (!sshData) return res.status(404).json({ success: false, error: 'Servidor não encontrado' });
    const stored = await rgetServerSSHKey(id);
    if (!stored) return res.status(400).json({ success: false, error: 'Chave SSH não definida para este servidor' });
    const { EncryptionService } = await import('../services/encryption.service');
    const enc = new EncryptionService();
    let privateKey: string;
    try { privateKey = enc.decrypt(stored); } catch { return res.status(400).json({ success: false, error: 'Chave SSH inválida' }); }
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const [pg, redis] = await Promise.all([
      providerService.listDockerPostgresContainersViaSSH({ sshHost: sshData.host, sshPort: sshData.port, sshUsername: sshData.username, sshKey: privateKey }),
      providerService.listDockerRedisContainersViaSSH({ sshHost: sshData.host, sshPort: sshData.port, sshUsername: sshData.username, sshKey: privateKey }),
    ]);
    res.json({ success: true, data: { postgres: pg, redis } });
  } catch (error) {
    logger.error('Error server docker scan:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/servers/:id/docker/import/postgres
 * Importa container Postgres como conexão usando chave armazenada
 * body: { containerName: string, organizationId?: string, name?: string }
 */
router.post('/servers/:id/docker/import/postgres', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    const { containerName, organizationId, name } = req.body || {};
    if (!containerName) return res.status(400).json({ success: false, error: 'containerName é obrigatório' });
    const sshData = await getServerSSHData(id);
    if (!sshData) return res.status(404).json({ success: false, error: 'Servidor não encontrado' });
    const stored = await rgetServerSSHKey(id);
    if (!stored) return res.status(400).json({ success: false, error: 'Chave SSH não definida para este servidor' });
    const { EncryptionService } = await import('../services/encryption.service');
    const enc = new EncryptionService();
    let privateKey: string;
    try { privateKey = enc.decrypt(stored); } catch { return res.status(400).json({ success: false, error: 'Chave SSH inválida' }); }
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const containers = await providerService.listDockerPostgresContainersViaSSH({ sshHost: sshData.host, sshPort: sshData.port, sshUsername: sshData.username, sshKey: privateKey });
    const match = containers.find(c => c.containerName === containerName);
    if (!match) return res.status(404).json({ success: false, error: 'Container não encontrado' });
    if (!match.hostPort) return res.status(400).json({ success: false, error: 'Container sem porta mapeada no host (5432). Exponha a porta.' });
    const encryptedPassword = match.password ? encryptionService.encrypt(match.password) : null;
    // Garantir que a organização existe
    const targetOrgId = organizationId || 'sistema';
    let org = await prisma.tenant.findUnique({ where: { id: targetOrgId } });
    if (!org && targetOrgId === 'sistema') {
      org = await prisma.tenant.create({
        data: {
          id: 'sistema',
          name: 'Sistema (Servidores SSH)',
          subdomain: 'sistema',
          plan: 'enterprise',
          billingEmail: 'admin@sistema.interno',
          dbStrategy: 'row_level',
          status: 'active',
          storageUsageBytes: BigInt(0),
          connectionCount: 0,
        }
      });
    }
    
    const connection = await prisma.databaseConnection.create({
      data: {
        organizationId: targetOrgId,
        name: name || match.containerName,
        provider: 'custom' as any,
        host: match.host,
        port: match.hostPort,
        databaseName: match.dbName || 'postgres',
        username: match.username || 'postgres',
        encryptedPassword,
        sslEnabled: false,
        connectionPoolSize: 10,
        status: 'active',
      }
    });
    res.status(201).json({ success: true, data: { connection } });
  } catch (error) {
    logger.error('Error server import postgres:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/servers/:id/docker/import/redis
 * Importa container Redis como conexão (persistência em databaseConnection com provider 'redis')
 * body: { containerName: string, organizationId?: string, name?: string }
 */
router.post('/servers/:id/docker/import/redis', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { id } = req.params;
    const { containerName, organizationId, name } = req.body || {};
    if (!containerName) return res.status(400).json({ success: false, error: 'containerName é obrigatório' });
    const sshData = await getServerSSHData(id);
    if (!sshData) return res.status(404).json({ success: false, error: 'Servidor não encontrado' });
    const stored = await rgetServerSSHKey(id);
    if (!stored) return res.status(400).json({ success: false, error: 'Chave SSH não definida para este servidor' });
    const { EncryptionService } = await import('../services/encryption.service');
    const enc = new EncryptionService();
    let privateKey: string;
    try { privateKey = enc.decrypt(stored); } catch { return res.status(400).json({ success: false, error: 'Chave SSH inválida' }); }
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const containers = await providerService.listDockerRedisContainersViaSSH({ sshHost: sshData.host, sshPort: sshData.port, sshUsername: sshData.username, sshKey: privateKey });
    const match = containers.find(c => c.containerName === containerName);
    if (!match) return res.status(404).json({ success: false, error: 'Container não encontrado' });
    if (!match.hostPort) return res.status(400).json({ success: false, error: 'Container sem porta mapeada no host (6379). Exponha a porta.' });
    
    // Garantir que a organização existe
    const targetOrgId = organizationId || 'sistema';
    let org = await prisma.tenant.findUnique({ where: { id: targetOrgId } });
    if (!org && targetOrgId === 'sistema') {
      org = await prisma.tenant.create({
        data: {
          id: 'sistema',
          name: 'Sistema (Servidores SSH)',
          subdomain: 'sistema',
          plan: 'enterprise',
          billingEmail: 'admin@sistema.interno',
          dbStrategy: 'row_level',
          status: 'active',
          storageUsageBytes: BigInt(0),
          connectionCount: 0,
        }
      });
    }
    
    const encryptedPassword = match.password ? encryptionService.encrypt(match.password) : null;
    const connection = await prisma.databaseConnection.create({
      data: {
        organizationId: targetOrgId,
        name: name || match.containerName,
        provider: 'vps_ssh', // Redis rodando em VPS SSH
        host: match.host,
        port: match.hostPort,
        databaseName: '0',
        username: '',
        encryptedPassword,
        sslEnabled: false,
        connectionPoolSize: 0,
        status: 'active',
      }
    });
    res.status(201).json({ success: true, data: { connection } });
  } catch (error) {
    logger.error('Error server import redis:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// ============================================
// Server Scan Automation Routes
// ============================================

/**
 * GET /api/admin/database/servers/:id/scan-results
 * Obter último resultado de scan de um servidor
 */
router.get('/servers/:id/scan-results', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await serverScanService.getScanResult(id);
    
    if (!result) {
      return res.json({
        success: true,
        data: null,
        message: 'Nenhum scan encontrado. Execute um scan primeiro.'
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error getting scan results:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/database/servers/scan-results
 * Obter todos os resultados de scan
 */
router.get('/servers/scan-results', async (req: Request, res: Response) => {
  try {
    const results = await serverScanService.getAllScanResults();
    
    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    logger.error('Error getting all scan results:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/database/servers/:id/health
 * Retorna saúde do servidor a partir do cache de scan; se ausente, realiza coleta integrada via SSH e atualiza o cache.
 */
router.get('/servers/:id/health', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sshData = await getServerSSHData(id);
    if (!sshData) return res.status(404).json({ success: false, error: 'Servidor não encontrado' });

    // Tenta do cache do scan
    const cached = await serverScanService.getScanResult(id);
    if (cached && cached.health) {
      return res.json({ success: true, data: cached.health });
    }

    // Sem cache: executar coleta integrada via SSH (reusa mesma lógica de scanServer)
    const stored = await rgetServerSSHKey(id);
    if (!stored) return res.status(400).json({ success: false, error: 'Chave SSH não definida para este servidor' });
    const { EncryptionService } = await import('../services/encryption.service');
    const enc = new EncryptionService();
    let privateKey: string;
    try { privateKey = enc.decrypt(stored); } catch { return res.status(400).json({ success: false, error: 'Chave SSH inválida' }); }

    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();

    // Executa coleta integrada
    const combined = await providerService.getHealthAndContainersViaSSH({
      sshHost: sshData.host,
      sshPort: sshData.port,
      sshUsername: sshData.username,
      sshKey: privateKey,
    });

    // Atualiza cache de scan com health
    // Mantém foundConnections atuais para consistência
    const prisma = getPrismaClient();
    const existingConnections = await prisma.databaseConnection.findMany({
      where: { host: sshData.host, databaseName: { not: '__server__' } },
      select: { id: true, name: true, host: true, port: true, provider: true, databaseName: true },
    });
    const scanResult = {
      postgres: combined.postgres || [],
      redis: combined.redis || [],
      foundConnections: existingConnections,
      scannedAt: new Date().toISOString(),
      health: combined.health,
    };
    await serverScanService.saveScanResult(id, scanResult as any);

    return res.json({ success: true, data: combined.health });
  } catch (error) {
    logger.error('Error getting server health (integrated):', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/servers/:id/scan-now
 * Forçar scan manual de um servidor
 */
router.post('/servers/:id/scan-now', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await serverScanService.scanServer(id);
    
    res.json({
      success: true,
      data: result,
      message: 'Scan executado com sucesso',
    });
  } catch (error) {
    logger.error('Error scanning server:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/database/servers/scan-all
 * Forçar scan de todos os servidores
 */
router.post('/servers/scan-all', async (req: Request, res: Response) => {
  try {
    await serverScanService.scanAllServers();
    
    res.json({
      success: true,
      message: 'Scan de todos os servidores iniciado',
    });
  } catch (error) {
    logger.error('Error scanning all servers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * DELETE /api/admin/database/servers/:id/scan-results
 * Limpar resultado de scan de um servidor
 */
router.delete('/servers/:id/scan-results', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await serverScanService.clearScanResult(id);
    
    res.json({
      success: true,
      message: 'Resultado de scan removido',
    });
  } catch (error) {
    logger.error('Error clearing scan result:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/database/found-databases
 * Obter todos os bancos encontrados nos servidores SSH (agregado)
 */
router.get('/found-databases', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    // Opcional: força um novo scan antes de retornar (baseado apenas em servidores cadastrados)
    if (req.query.refresh === 'true') {
      try {
        await serverScanService.scanAllServers();
      } catch (e) {
        logger.warn('found-databases: scanAllServers failed (continuing with cached results)', e);
      }
    }
    const scanResults = await serverScanService.getAllScanResults();
    
    // Buscar servidores para mapear IDs aos nomes
    const servers = await prisma.databaseConnection.findMany({
      where: {
        databaseName: '__server__',
        status: 'active',
      },
      select: {
        id: true,
        name: true,
      },
    });
    
    const serverMap = new Map(servers.map(s => [s.id, s.name]));
    const validServerIds = new Set(servers.map(s => s.id));
    
    // Agregar bancos encontrados de todos os servidores
    const foundDatabases: Array<{
      containerName: string;
      host: string;
      hostPort?: number;
      dbName?: string;
      username?: string;
      password?: string;
      image?: string;
      provider: 'postgres' | 'redis';
      serverId: string;
      serverName: string;
      scannedAt?: string;
      isDocker?: boolean;
    }> = [];
    
    for (const [serverId, result] of Object.entries(scanResults)) {
      // Considerar apenas servidores cadastrados
      if (!validServerIds.has(serverId)) continue;
      const serverName = serverMap.get(serverId) || 'Servidor desconhecido';
      
      // Adicionar PostgreSQL encontrados
      if (result.postgres && Array.isArray(result.postgres)) {
        for (const pg of result.postgres) {
          foundDatabases.push({
            containerName: pg.containerName || '',
            host: pg.host || '',
            hostPort: pg.hostPort,
            dbName: pg.dbName,
            username: pg.username,
            password: pg.password,
            image: pg.image,
            provider: 'postgres',
            serverId,
            serverName,
            scannedAt: result.scannedAt,
            isDocker: true,
          });
        }
      }
      
      // Adicionar Redis encontrados
      if (result.redis && Array.isArray(result.redis)) {
        for (const rd of result.redis) {
          foundDatabases.push({
            containerName: rd.containerName || '',
            host: rd.host || '',
            hostPort: rd.hostPort,
            provider: 'redis',
            serverId,
            serverName,
            scannedAt: result.scannedAt,
            isDocker: true,
          });
        }
      }
    }
    
    // Marcar quais já estão cadastrados
    const existingConnections = await prisma.databaseConnection.findMany({
      where: {
        databaseName: { not: '__server__' },
      },
      select: {
        host: true,
        port: true,
        provider: true,
      },
    });
    
    const databasesWithStatus = foundDatabases.map(db => {
      const isRegistered = existingConnections.some(
        conn => conn.host === db.host && 
                conn.port === db.hostPort
      );
      
      return {
        ...db,
        isRegistered,
      };
    });
    
    res.json({
      success: true,
      data: databasesWithStatus,
    });
  } catch (error) {
    logger.error('Error getting found databases:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Health Checks Routes
// ============================================

/**
 * GET /api/admin/database/health-checks
 * Listar health checks de todas as organizações
 */
router.get('/health-checks', async (req: Request, res: Response) => {
  try {
    const healthChecksMap = healthCheckService.getAllHealthStatuses();
    const healthChecks = Array.from(healthChecksMap.values()).map(status => ({
      ...status,
      lastCheck: status.lastCheck instanceof Date ? status.lastCheck.toISOString() : status.lastCheck,
    }));

    res.json({
      success: true,
      data: healthChecks,
    });
  } catch (error) {
    logger.error('Error fetching health checks:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/database/health-checks/:organizationId
 * Health check de uma organização específica
 */
router.get('/health-checks/:organizationId', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.params;
    const status = await healthCheckService.getHealthStatus(organizationId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error fetching health check:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Alerts Routes
// ============================================

/**
 * GET /api/admin/database/alerts
 * Listar alertas ativos
 */
router.get('/alerts', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { page = 1, limit = 50, severity, organizationId } = req.query;

    const where: any = {};
    if (severity) where.severity = severity;
    if (organizationId) where.organizationId = organizationId;

    // TODO: Criar modelo Alert no schema se não existir
    // Por enquanto, usar TenantAccessAudit para alertas de data leak
    const whereAlerts: any = { action: 'data_leak_attempt' };
    if (organizationId) whereAlerts.organizationId = organizationId;

    const [alerts, total] = await Promise.all([
      prisma.tenantAccessAudit.findMany({
        where: whereAlerts,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { detectedAt: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.tenantAccessAudit.count({ where: whereAlerts }),
    ]);

    // Transformar para formato de alertas
    const formattedAlerts = alerts.map(audit => ({
      id: audit.id,
      organizationId: audit.organizationId,
      type: 'data_leak_attempt',
      severity: 'critical' as const,
      message: `Data leak attempt detected: ${audit.action} on ${audit.resource}`,
      createdAt: audit.detectedAt.toISOString(),
      organization: (audit as any).organization,
    }));

    res.json({
      success: true,
      data: {
        items: formattedAlerts,
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: Number(page) * Number(limit) < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Integrations Routes
// ============================================

/**
 * GET /api/admin/database/integrations
 * Listar configurações de integração de providers
 */
router.get('/integrations', async (req: Request, res: Response) => {
  try {
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();

    const providers = [
      { name: 'railway', displayName: 'Railway', enabled: await providerService.testProviderConnection('railway') },
      { name: 'supabase', displayName: 'Supabase', enabled: await providerService.testProviderConnection('supabase') },
      { name: 'neon', displayName: 'Neon', enabled: await providerService.testProviderConnection('neon') },
      { name: 'aws_rds', displayName: 'AWS RDS', enabled: await providerService.testProviderConnection('aws_rds') },
      { name: 'oracle_cloud', displayName: 'Oracle Cloud', enabled: await providerService.testProviderConnection('oracle_cloud') },
    ];

    res.json({
      success: true,
      data: providers,
    });
  } catch (error) {
    logger.error('Error fetching integrations:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/database/integrations/:providerName/test
 * Testar conexão com provider
 */
router.post('/integrations/:providerName/test', async (req: Request, res: Response) => {
  try {
    const { providerName } = req.params;
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();

    const connected = await providerService.testProviderConnection(providerName as any);

    res.json({
      success: connected,
      data: { status: connected ? 'connected' : 'disconnected' },
      message: connected ? 'Connection successful' : 'Connection failed',
    });
  } catch (error) {
    logger.error('Error testing integration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * POST /api/admin/database/integrations/ssh/test
 * Testar conexão SSH direta (sem provisionar DB)
 */
router.post('/integrations/ssh/test', async (req: Request, res: Response) => {
  try {
    logger.info('SSH test request received', {
      hasHost: !!req.body?.sshHost,
      hasUsername: !!req.body?.sshUsername,
      hasKey: !!req.body?.sshKey,
      keyLength: req.body?.sshKey?.length || 0,
    });

    const { sshHost, sshPort, sshUsername, sshKey } = req.body || {};
    
    if (!sshHost || !sshUsername || !sshKey) {
      return res.status(400).json({ 
        success: false, 
        error: 'sshHost, sshUsername e sshKey são obrigatórios',
        details: {
          sshHost: !sshHost ? 'missing' : 'provided',
          sshUsername: !sshUsername ? 'missing' : 'provided',
          sshKey: !sshKey ? 'missing' : `provided (${sshKey.length} chars)`,
        }
      });
    }
    
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    
    logger.info('Starting SSH connection test', {
      host: sshHost,
      port: sshPort || 22,
      username: sshUsername,
    });
    
    const result = await providerService.testSSHConnection({ sshHost, sshPort, sshUsername, sshKey });
    
    logger.info('SSH test result', {
      success: result.success,
      message: result.message,
      host: sshHost,
    });
    
    return res.json({ 
      success: result.success, 
      data: { status: result.success ? 'connected' : 'disconnected' }, 
      message: result.message 
    });
  } catch (error) {
    logger.error('Error testing SSH connection:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error',
      details: error instanceof Error ? error.stack : undefined
    });
  }
});

/**
 * POST /api/admin/database/integrations/ssh/health
 * Coletar saúde do servidor via SSH (CPU, memória, discos, docker)
 */
router.post('/integrations/ssh/health', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    let { sshHost, sshPort, sshUsername, sshKey, serverId } = req.body || {};

    // Nova lógica: se não vier sshKey (ou host/username), tentar resolver pelo serverId (chave persistida)
    if ((!sshHost || !sshUsername || !sshKey) && serverId) {
      // Buscar server no banco para host/port/username
      const server = await prisma.databaseConnection.findUnique({
        where: { id: serverId },
        select: { host: true, port: true, username: true }
      });
      if (!server) return res.status(404).json({ success: false, error: 'Servidor não encontrado' });
      sshHost = sshHost || server.host;
      sshPort = sshPort || server.port || 22;
      sshUsername = sshUsername || server.username || 'root';
      // Buscar chave persistida no Redis (criptografada no backend)
      const stored = await rgetServerSSHKey(serverId);
      if (stored) {
        try {
          const { EncryptionService } = await import('../services/encryption.service');
          const enc = new EncryptionService();
          sshKey = enc.decrypt(stored);
        } catch {}
      }
    }

    if (!sshHost || !sshUsername || !sshKey) {
      return res.status(400).json({ success: false, error: 'sshHost, sshUsername e sshKey são obrigatórios' });
    }

    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const stats = await providerService.getServerHealthViaSSH({ sshHost, sshPort, sshUsername, sshKey });
    if (serverId) {
      const payload = { ts: Date.now(), data: stats };
      pushServerMetric(serverId, stats);
      await rpushServerMetric(serverId, payload);
    }
    return res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching SSH server health:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * GET /api/admin/database/integrations/ssh/health/history
 * Histórico em memória de métricas por servidor
 */
router.get('/integrations/ssh/health/history', async (req: Request, res: Response) => {
  try {
    const serverId = String(req.query.serverId || '')
    const limit = Number(req.query.limit || 200)
    if (!serverId) return res.status(400).json({ success: false, error: 'serverId é obrigatório' })
    // Preferir Redis se disponível
    const fromRedis = await rgetServerMetrics(serverId, limit)
    const arr = fromRedis.length ? fromRedis : (serverMetricsHistory.get(serverId) || [])
    const items = arr.slice(0, limit)
    res.json({ success: true, data: { items } })
  } catch (error) {
    logger.error('Error fetching server metrics history:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * PUT /api/admin/database/integrations/ssh/health/retention
 * Configura retenção (trim e TTL) do histórico em Redis para um servidor
 * body: { serverId: string, maxItems?: number, ttlDays?: number }
 */
router.put('/integrations/ssh/health/retention', async (req: Request, res: Response) => {
  try {
    const { serverId, maxItems, ttlDays } = req.body || {};
    if (!serverId) return res.status(400).json({ success: false, error: 'serverId é obrigatório' });
    const r = getRedis();
    if (!r) return res.status(503).json({ success: false, error: 'Redis não configurado' });
    const key = REDIS_KEY(serverId);
    if (typeof maxItems === 'number' && maxItems > 0) {
      await r.ltrim(key, 0, maxItems - 1);
    }
    if (typeof ttlDays === 'number' && ttlDays > 0) {
      await r.expire(key, Math.floor(ttlDays * 24 * 60 * 60));
    }
    res.json({ success: true });
  } catch (error) {
    logger.error('Error setting retention:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/database/integrations/ssh/health/history
 * Limpa histórico duradouro e em memória de um servidor
 * query: serverId
 */
router.delete('/integrations/ssh/health/history', async (req: Request, res: Response) => {
  try {
    const serverId = String(req.query.serverId || '');
    if (!serverId) return res.status(400).json({ success: false, error: 'serverId é obrigatório' });
    const r = getRedis();
    if (r) await r.del(REDIS_KEY(serverId));
    serverMetricsHistory.delete(serverId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting history:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/integrations/:providerName/provision
 * Provisionar um novo database em um provider e registrar a conexão
 */
router.post('/integrations/:providerName/provision', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { providerName } = req.params;
    const { organizationId, name, region, plan, backupEnabled } = req.body;

    if (!organizationId || !name) {
      return res.status(400).json({ success: false, error: 'organizationId and name are required' });
    }

    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();

    let provisioned;
    switch (providerName) {
      case 'railway':
        provisioned = await providerService.provisionRailwayDatabase({ name, region, plan, backupEnabled });
        break;
      case 'supabase':
        provisioned = await providerService.provisionSupabaseDatabase({ name, region, plan, backupEnabled });
        break;
      case 'neon':
        provisioned = await providerService.provisionNeonDatabase({ name, region, plan, backupEnabled });
        break;
      case 'aws_rds':
        provisioned = await providerService.provisionAWSRDSDatabase({ name, region, plan, backupEnabled });
        break;
      default:
        return res.status(400).json({ success: false, error: `Unsupported provider: ${providerName}` });
    }

    // Opcional: testar conexão
    const ok = await providerService.testDatabaseConnection(provisioned.connectionString);
    if (!ok) {
      return res.status(502).json({ success: false, error: 'Provisioned database is unreachable' });
    }

    // Persistir conexão criptografando senha
    const encryptedPassword = provisioned.password ? encryptionService.encrypt(provisioned.password) : null;
    const connection = await prisma.databaseConnection.create({
      data: {
        organizationId,
        name: `${providerName}-${name}`,
        provider: providerName as any,
        host: provisioned.host,
        port: provisioned.port,
        databaseName: provisioned.databaseName,
        username: provisioned.username,
        encryptedPassword,
        sslEnabled: true,
        connectionPoolSize: 10,
        status: 'active',
      }
    });

    res.status(201).json({ success: true, data: { connection }, message: 'Database provisioned and connection saved' });
  } catch (error) {
    logger.error('Error provisioning provider database:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/integrations/docker/provision
 * Provisionar Postgres via Docker em VPS com Docker instalado (via SSH)
 */
router.post('/integrations/docker/provision', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { organizationId, name, sshHost, sshPort, sshUsername, sshKey, containerName, dbName, dbUser, dbPassword, hostPort, volumeName, image } = req.body || {};
    if (!sshHost || !sshUsername || !sshKey || !containerName) {
      return res.status(400).json({ success: false, error: 'sshHost, sshUsername, sshKey e containerName são obrigatórios' });
    }

    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const provisioned = await providerService.provisionDockerPostgresViaSSH({ sshHost, sshPort, sshUsername, sshKey, containerName, dbName, dbUser, dbPassword, hostPort, volumeName, image });

    // Opcional: testar conexão TCP
    const ok = await providerService.testDatabaseConnection(provisioned.connectionString);
    if (!ok) {
      return res.status(502).json({ success: false, error: 'Container provisionado, porém a conexão ao Postgres falhou' });
    }

    let connection: any = null;
    if (organizationId && name) {
      const encryptedPassword = provisioned.password ? encryptionService.encrypt(provisioned.password) : null;
      connection = await prisma.databaseConnection.create({
        data: {
          organizationId,
          name: `${containerName}`,
          provider: 'custom' as any,
          host: provisioned.host,
          port: provisioned.port,
          databaseName: provisioned.databaseName,
          username: provisioned.username,
          encryptedPassword,
          sslEnabled: false,
          connectionPoolSize: 10,
          status: 'active',
        }
      });
    }

    res.status(201).json({ success: true, data: { provisioned, connection }, message: 'Postgres via Docker provisionado com sucesso' });
  } catch (error) {
    logger.error('Error provisioning Docker Postgres via SSH:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/integrations/docker/scan
 * Escanear containers Docker de Postgres via SSH (sem criar nada)
 */
router.post('/integrations/docker/scan', async (req: Request, res: Response) => {
  try {
    const { sshHost, sshPort, sshUsername, sshKey } = req.body || {};
    if (!sshHost || !sshUsername || !sshKey) {
      return res.status(400).json({ success: false, error: 'sshHost, sshUsername e sshKey são obrigatórios' });
    }
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const containers = await providerService.listDockerPostgresContainersViaSSH({ sshHost, sshPort, sshUsername, sshKey });
    return res.json({ success: true, data: { items: containers, total: containers.length } });
  } catch (error) {
    logger.error('Error scanning Docker containers via SSH:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * POST /api/admin/database/integrations/docker/import
 * Importar um container Postgres específico como conexão (sem criar container)
 */
router.post('/integrations/docker/import', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { organizationId, name, sshHost, sshPort, sshUsername, sshKey, containerName } = req.body || {};
    if (!organizationId || !name || !sshHost || !sshUsername || !sshKey || !containerName) {
      return res.status(400).json({ success: false, error: 'organizationId, name, sshHost, sshUsername, sshKey e containerName são obrigatórios' });
    }
    const { ProviderIntegrationService } = await import('../services/provider-integration.service');
    const providerService = new ProviderIntegrationService();
    const containers = await providerService.listDockerPostgresContainersViaSSH({ sshHost, sshPort, sshUsername, sshKey });
    const match = containers.find(c => c.containerName === containerName);
    if (!match) {
      return res.status(404).json({ success: false, error: 'Container não encontrado' });
    }
    if (!match.hostPort) {
      return res.status(400).json({ success: false, error: 'Container sem porta mapeada no host (5432). Exponha a porta para importar.' });
    }

    const encryptedPassword = match.password ? encryptionService.encrypt(match.password) : null;
    const connection = await prisma.databaseConnection.create({
      data: {
        organizationId,
        name,
        provider: 'custom' as any,
        host: match.host,
        port: match.hostPort,
        databaseName: match.dbName || 'postgres',
        username: match.username || 'postgres',
        encryptedPassword,
        sslEnabled: false,
        connectionPoolSize: 10,
        status: 'active',
      }
    });

    res.status(201).json({ success: true, data: { connection }, message: 'Conexão importada do Docker com sucesso' });
  } catch (error) {
    logger.error('Error importing Docker container as connection:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * PUT /api/admin/database/integrations/:providerName
 * Atualizar configuração de provider
 */
router.put('/integrations/:providerName', async (req: Request, res: Response) => {
  try {
    const { providerName } = req.params;
    // TODO: Salvar configurações no banco ou .env
    // Por enquanto, apenas retornar sucesso
    res.json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error) {
    logger.error('Error updating integration:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ============================================
// Logs and Audit Routes
// ============================================

/**
 * GET /api/admin/database/logs
 * Listar logs de auditoria
 */
router.get('/logs', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { page = 1, limit = 50, organizationId, action, hasTenantContext, startDate, endDate } = req.query;

    const where: any = {};
    if (organizationId) where.organizationId = organizationId as string;
    if (action) where.action = action as string;
    if (hasTenantContext !== undefined) where.hasTenantContext = hasTenantContext === 'true';
    if (startDate || endDate) {
      where.detectedAt = {};
      if (startDate) where.detectedAt.gte = new Date(startDate as string);
      if (endDate) where.detectedAt.lte = new Date(endDate as string);
    }

    const [logs, total] = await Promise.all([
      prisma.tenantAccessAudit.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { detectedAt: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.tenantAccessAudit.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        items: logs,
        total,
        page: Number(page),
        limit: Number(limit),
        hasMore: Number(page) * Number(limit) < total,
      },
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * GET /api/admin/database/logs/export
 * Exportar logs para CSV/JSON
 */
router.get('/logs/export', async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { format = 'json', ...filters } = req.query;

    const where: any = {};
    if (filters.organizationId) where.organizationId = filters.organizationId as string;
    if (filters.action) where.action = filters.action as string;

    const logs = await prisma.tenantAccessAudit.findMany({
      where,
      orderBy: { detectedAt: 'desc' },
      take: 10000,
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=logs-${Date.now()}.csv`);
      
      const headers = ['id', 'organizationId', 'userId', 'action', 'resource', 'hasTenantContext', 'ipAddress', 'detectedAt'];
      const csv = [
        headers.join(','),
        ...logs.map(log => [
          log.id,
          log.organizationId,
          log.userId || '',
          log.action,
          log.resource,
          log.hasTenantContext,
          log.ipAddress || '',
          (log as any).detectedAt?.toISOString?.() || '',
        ].join(','))
      ].join('\n');
      
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=logs-${Date.now()}.json`);
      res.json({ success: true, data: logs });
    }
  } catch (error) {
    logger.error('Error exporting logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * =====================================================
 * DOCKER CONTAINER MANAGEMENT ROUTES
 * =====================================================
 */

/**
 * POST /api/admin/database/servers/:id/docker/containers/:containerId/start
 * Iniciar um container Docker
 */
router.post('/servers/:id/docker/containers/:containerId/start', async (req: Request, res: Response) => {
  try {
    const { id, containerId } = req.params;

    logger.info('Starting Docker container', { serverId: id, containerId });

    // Obter dados do servidor
    const sshData = await getServerSSHData(id);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    // Buscar chave SSH do Redis
    const sshKey = await getServerSSHKey(id);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    // Executar comando Docker via SSH
    const providerService = new ProviderIntegrationService();
    const result = await providerService.executeSSHCommand(
      sshData.host,
      sshData.port,
      sshData.username,
      sshKey,
      `docker start ${containerId}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('Container started successfully', { serverId: id, containerId });

    res.json({
      success: true,
      message: 'Container started successfully',
      data: { containerId, output: result.output }
    });
  } catch (error) {
    logger.error('Error starting container:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start container'
    });
  }
});

/**
 * POST /api/admin/database/servers/:id/docker/containers/:containerId/stop
 * Parar um container Docker
 */
router.post('/servers/:id/docker/containers/:containerId/stop', async (req: Request, res: Response) => {
  try {
    const { id, containerId } = req.params;

    logger.info('Stopping Docker container', { serverId: id, containerId });

    const sshData = await getServerSSHData(id);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const sshKey = await getServerSSHKey(id);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const providerService = new ProviderIntegrationService();
    const result = await providerService.executeSSHCommand(
      sshData.host,
      sshData.port,
      sshData.username,
      sshKey,
      `docker stop ${containerId}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('Container stopped successfully', { serverId: id, containerId });

    res.json({
      success: true,
      message: 'Container stopped successfully',
      data: { containerId, output: result.output }
    });
  } catch (error) {
    logger.error('Error stopping container:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop container'
    });
  }
});

/**
 * POST /api/admin/database/servers/:id/docker/containers/:containerId/restart
 * Reiniciar um container Docker
 */
router.post('/servers/:id/docker/containers/:containerId/restart', async (req: Request, res: Response) => {
  try {
    const { id, containerId } = req.params;

    logger.info('Restarting Docker container', { serverId: id, containerId });

    const sshData = await getServerSSHData(id);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const sshKey = await getServerSSHKey(id);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const providerService = new ProviderIntegrationService();
    const result = await providerService.executeSSHCommand(
      sshData.host,
      sshData.port,
      sshData.username,
      sshKey,
      `docker restart ${containerId}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('Container restarted successfully', { serverId: id, containerId });

    res.json({
      success: true,
      message: 'Container restarted successfully',
      data: { containerId, output: result.output }
    });
  } catch (error) {
    logger.error('Error restarting container:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart container'
    });
  }
});

/**
 * GET /api/admin/database/servers/:id/docker/containers/:containerId/logs
 * Obter logs de um container Docker
 */
router.get('/servers/:id/docker/containers/:containerId/logs', async (req: Request, res: Response) => {
  try {
    const { id, containerId } = req.params;
    const { tail = '100' } = req.query;

    logger.info('Fetching container logs', { serverId: id, containerId, tail });

    const sshData = await getServerSSHData(id);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const sshKey = await getServerSSHKey(id);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const providerService = new ProviderIntegrationService();
    const result = await providerService.executeSSHCommand(
      sshData.host,
      sshData.port,
      sshData.username,
      sshKey,
      `docker logs --tail ${tail} ${containerId}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    res.json({
      success: true,
      data: {
        containerId,
        logs: result.output || '',
        tail: Number(tail)
      }
    });
  } catch (error) {
    logger.error('Error fetching container logs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch logs'
    });
  }
});

/**
 * =====================================================
 * DOCKER IMAGE MANAGEMENT ROUTES
 * =====================================================
 */

/**
 * POST /api/admin/database/servers/:id/docker/images/pull
 * Pull uma nova imagem Docker
 */
router.post('/servers/:id/docker/images/pull', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageName } = req.body;

    if (!imageName) {
      return res.status(400).json({
        success: false,
        error: 'Image name is required'
      });
    }

    logger.info('Pulling Docker image', { serverId: id, imageName });

    const sshData = await getServerSSHData(id);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const sshKey = await getServerSSHKey(id);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const providerService = new ProviderIntegrationService();
    const result = await providerService.executeSSHCommand(
      sshData.host,
      sshData.port,
      sshData.username,
      sshKey,
      `docker pull ${imageName}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('Image pulled successfully', { serverId: id, imageName });

    res.json({
      success: true,
      message: 'Image pulled successfully',
      data: { imageName, output: result.output }
    });
  } catch (error) {
    logger.error('Error pulling image:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pull image'
    });
  }
});

/**
 * DELETE /api/admin/database/servers/:id/docker/images/:imageId
 * Remover uma imagem Docker
 */
router.delete('/servers/:id/docker/images/:imageId', async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;

    logger.info('Removing Docker image', { serverId: id, imageId });

    const sshData = await getServerSSHData(id);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const sshKey = await getServerSSHKey(id);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const providerService = new ProviderIntegrationService();
    const result = await providerService.executeSSHCommand(
      sshData.host,
      sshData.port,
      sshData.username,
      sshKey,
      `docker rmi ${imageId}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    logger.info('Image removed successfully', { serverId: id, imageId });

    res.json({
      success: true,
      message: 'Image removed successfully',
      data: { imageId, output: result.output }
    });
  } catch (error) {
    logger.error('Error removing image:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove image'
    });
  }
});

/**
 * GET /api/admin/database/servers/:id/docker/images/:imageId/inspect
 * Inspecionar uma imagem Docker
 */
router.get('/servers/:id/docker/images/:imageId/inspect', async (req: Request, res: Response) => {
  try {
    const { id, imageId } = req.params;

    logger.info('Inspecting Docker image', { serverId: id, imageId });

    const sshData = await getServerSSHData(id);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const sshKey = await getServerSSHKey(id);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const providerService = new ProviderIntegrationService();
    const result = await providerService.executeSSHCommand(
      sshData.host,
      sshData.port,
      sshData.username,
      sshKey,
      `docker inspect ${imageId}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // Parse JSON output
    let inspectData;
    try {
      inspectData = JSON.parse(result.output || '[]');
    } catch (parseError) {
      inspectData = { raw: result.output };
    }

    res.json({
      success: true,
      data: {
        imageId,
        inspect: inspectData
      }
    });
  } catch (error) {
    logger.error('Error inspecting image:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to inspect image'
    });
  }
});

/**
 * GET /api/admin/database/servers/:id/metrics/history
 * Obter histórico de métricas do servidor
 */
router.get('/servers/:id/metrics/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hours = '24', limit = '200' } = req.query;

    logger.info('Fetching server metrics history', { serverId: id, hours, limit });

    // Buscar métricas usando a função existente
    const metrics = await rgetServerMetrics(id, Number(limit));

    // Filtrar por período se especificado
    const hoursNum = Number(hours);
    const cutoffTime = Date.now() - (hoursNum * 60 * 60 * 1000);
    const filteredMetrics = metrics.filter(m => m.ts >= cutoffTime);

    res.json({
      success: true,
      data: {
        serverId: id,
        metrics: filteredMetrics.reverse(), // Ordem cronológica (mais antigo primeiro)
        period: `${hours}h`,
        total: filteredMetrics.length
      }
    });
  } catch (error) {
    logger.error('Error fetching metrics history:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch metrics'
    });
  }
});

export default router;

