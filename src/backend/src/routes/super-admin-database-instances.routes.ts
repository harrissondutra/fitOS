import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/superAdmin';
import { DockerDatabaseInstanceService } from '../services/docker-database-instance.service';
import { ProviderIntegrationService } from '../services/provider-integration.service';
import { EncryptionService } from '../services/encryption.service';
import { serializeBigInt } from '../utils/bigint-serializer';
import Redis from 'ioredis';

const router = Router();
const prisma = getPrismaClient();
const databaseInstanceService = new DockerDatabaseInstanceService();
const encryptionService = new EncryptionService();
const providerService = new ProviderIntegrationService();

// Middleware: Requer SUPER_ADMIN para todas as rotas
const authMiddleware = getAuthMiddleware();
router.use(authMiddleware.requireAuth());
router.use(requireSuperAdmin);

// Helper para obter dados SSH de um servidor
async function getServerSSHData(id: string) {
  const prisma = getPrismaClient();
  const server = await prisma.databaseConnection.findUnique({ 
    where: { id },
    select: { 
      id: true, 
      host: true, 
      port: true, 
      username: true,
      databaseName: true
    }
  });
  
  if (!server || server.databaseName !== '__server__') return null;
  
  return {
    host: server.host,
    port: server.port || 22,
    username: server.username || 'root',
  };
}

// Helper para obter chave SSH do servidor
async function getServerSSHKey(id: string): Promise<string | null> {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const encryptedKey = await redis.get(`fitos:servers:sshkey:${id}`);
  await redis.quit();

  if (!encryptedKey) return null;

  try {
    const decrypted = encryptionService.decrypt(encryptedKey);
    return decrypted;
  } catch (error) {
    logger.error('Error decrypting SSH key', { error, serverId: id });
    return null;
  }
}

/**
 * GET /api/super-admin/database
 * Listar todos os bancos (containers Docker encontrados + instâncias gerenciadas)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { serverId, tenantId, databaseType, status } = req.query;

    const result = await databaseInstanceService.listAllDatabases({
      serverId: serverId as string | undefined,
      tenantId: tenantId as string | undefined,
      databaseType: databaseType as any,
      status: status as any
    });

    res.json({
      success: true,
      data: {
        managed: result.managed,
        discovered: result.discovered,
        total: result.managed.length + result.discovered.length
      }
    });
  } catch (error) {
    logger.error('Error listing databases:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/database/servers/:serverId/containers
 * Listar containers Docker de um servidor específico
 */
router.get('/servers/:serverId/containers', async (req: Request, res: Response) => {
  try {
    const { serverId } = req.params;
    
    const sshData = await getServerSSHData(serverId);
    if (!sshData) {
      return res.status(404).json({
        success: false,
        error: 'Server not found'
      });
    }

    const sshKey = await getServerSSHKey(serverId);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const sshOptions = {
      sshHost: sshData.host,
      sshPort: sshData.port,
      sshUsername: sshData.username,
      sshKey: sshKey
    };

    const [postgres, mysql, redis] = await Promise.all([
      providerService.listDockerPostgresContainersViaSSH(sshOptions),
      providerService.listDockerMySQLContainersViaSSH(sshOptions),
      providerService.listDockerRedisContainersViaSSH(sshOptions)
    ]);

    res.json({
      success: true,
      data: {
        postgresql: postgres.map(c => ({ ...c, databaseType: 'postgresql' as const })),
        mysql: mysql.map(c => ({ ...c, databaseType: 'mysql' as const })),
        redis: redis.map(c => ({ ...c, databaseType: 'redis' as const }))
      }
    });
  } catch (error) {
    logger.error('Error listing server containers:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/database/tenants
 * Listar tenants com planos Enterprise e Custom
 */
router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const tenants = await databaseInstanceService.listEnterpriseAndCustomTenants();

    res.json({
      success: true,
      data: serializeBigInt(tenants)
    });
  } catch (error) {
    logger.error('Error listing tenants:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/database/tenants/:tenantId/databases
 * Listar bancos de dados de um tenant específico
 */
router.get('/tenants/:tenantId/databases', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.params;

    const databases = await databaseInstanceService.listDatabasesByTenant(tenantId);

    res.json({
      success: true,
      data: databases
    });
  } catch (error) {
    logger.error('Error listing tenant databases:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/database
 * Criar novo banco Docker
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      serverId,
      tenantId,
      databaseType,
      databaseName,
      containerName,
      port,
      username,
      password,
      schemaName,
      image,
      // Campos para conexões externas
      provisionTarget,
      provider,
      externalHost,
      externalPort,
      externalUsername,
      externalPassword,
      connectionString
    } = req.body;

    // Validação básica
    if (!tenantId || !databaseType || !databaseName) {
      return res.status(400).json({
        success: false,
        error: 'tenantId, databaseType, and databaseName are required'
      });
    }

    // Validação específica por tipo
    const isExternal = provisionTarget && provisionTarget !== 'vps_ssh';
    if (isExternal) {
      // Para conexões externas, serverId não é obrigatório
      if (!connectionString && (!externalHost || !externalPort || !externalUsername || !externalPassword)) {
        return res.status(400).json({
          success: false,
          error: 'For external connections, provide connectionString or all fields: externalHost, externalPort, externalUsername, externalPassword'
        });
      }
    } else {
      // Para VPS SSH, serverId é obrigatório
      if (!serverId) {
        return res.status(400).json({
          success: false,
          error: 'serverId is required for VPS SSH connections'
        });
      }
    }

    const instance = await databaseInstanceService.createDatabaseInstance({
      serverId,
      tenantId,
      databaseType,
      databaseName,
      containerName,
      port,
      username,
      password,
      schemaName,
      image,
      provisionTarget,
      provider,
      externalHost,
      externalPort,
      externalUsername,
      externalPassword,
      connectionString
    });

    res.status(201).json({
      success: true,
      data: instance,
      message: 'Database instance created successfully'
    });
  } catch (error) {
    logger.error('Error creating database instance:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (typeof message === 'string' && message.startsWith('PORT_IN_USE:')) {
      const port = message.split(':')[1];
      return res.status(409).json({ success: false, error: `Porta ${port} já está em uso no servidor. Escolha outra porta.` });
    }
    res.status(500).json({
      success: false,
      error: message
    });
  }
});

/**
 * GET /api/super-admin/database/:id
 * Obter detalhes de uma instância
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const instance = await databaseInstanceService.getDatabaseInstance(id);

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Database instance not found'
      });
    }

    res.json({
      success: true,
      data: instance
    });
  } catch (error) {
    logger.error('Error getting database instance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * PUT /api/super-admin/database/:id
 * Atualizar banco
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const instance = await databaseInstanceService.updateDatabaseInstance(id, updateData);

    res.json({
      success: true,
      data: instance,
      message: 'Database instance updated successfully'
    });
  } catch (error) {
    logger.error('Error updating database instance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/super-admin/database/:id
 * Deletar banco e container
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await databaseInstanceService.deleteDatabaseInstance(id);

    res.json({
      success: true,
      message: 'Database instance deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting database instance:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/database/:id/start
 * Iniciar container
 */
router.post('/:id/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const instance = await prisma.databaseInstance.findUnique({
      where: { id },
      include: {
        server: {
          select: {
            host: true,
            port: true,
            username: true
          }
        }
      }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Database instance not found'
      });
    }

    const sshKey = await getServerSSHKey(instance.serverId);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const result = await providerService.executeSSHCommand(
      instance.server.host,
      instance.server.port || 22,
      instance.server.username || 'root',
      sshKey,
      `docker start ${instance.containerName}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // Atualizar status
    await prisma.databaseInstance.update({
      where: { id },
      data: { status: 'active' }
    });

    res.json({
      success: true,
      message: 'Container started successfully',
      data: { containerName: instance.containerName, output: result.output }
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
 * POST /api/super-admin/database/:id/stop
 * Parar container
 */
router.post('/:id/stop', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const instance = await prisma.databaseInstance.findUnique({
      where: { id },
      include: {
        server: {
          select: {
            host: true,
            port: true,
            username: true
          }
        }
      }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Database instance not found'
      });
    }

    const sshKey = await getServerSSHKey(instance.serverId);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const result = await providerService.executeSSHCommand(
      instance.server.host,
      instance.server.port || 22,
      instance.server.username || 'root',
      sshKey,
      `docker stop ${instance.containerName}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // Atualizar status
    await prisma.databaseInstance.update({
      where: { id },
      data: { status: 'inactive' }
    });

    res.json({
      success: true,
      message: 'Container stopped successfully',
      data: { containerName: instance.containerName, output: result.output }
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
 * POST /api/super-admin/database/:id/restart
 * Reiniciar container
 */
router.post('/:id/restart', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const instance = await prisma.databaseInstance.findUnique({
      where: { id },
      include: {
        server: {
          select: {
            host: true,
            port: true,
            username: true
          }
        }
      }
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        error: 'Database instance not found'
      });
    }

    const sshKey = await getServerSSHKey(instance.serverId);
    if (!sshKey) {
      return res.status(400).json({
        success: false,
        error: 'SSH key not configured for this server'
      });
    }

    const result = await providerService.executeSSHCommand(
      instance.server.host,
      instance.server.port || 22,
      instance.server.username || 'root',
      sshKey,
      `docker restart ${instance.containerName}`
    );

    if (result.error) {
      throw new Error(result.error);
    }

    // Atualizar status
    await prisma.databaseInstance.update({
      where: { id },
      data: { status: 'active' }
    });

    res.json({
      success: true,
      message: 'Container restarted successfully',
      data: { containerName: instance.containerName, output: result.output }
    });
  } catch (error) {
    logger.error('Error restarting container:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restart container'
    });
  }
});

export default router;

