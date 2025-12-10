/**
 * Provider Authentication Routes
 * Gerencia autenticação com provedores externos e listagem de bancos
 */

import { Router, Request, Response } from 'express';
import { requireSuperAdmin } from '../middleware/superAdmin';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { ExternalDatabaseProvidersService, ProviderAuth } from '../services/external-database-providers.service';
import { EncryptionService } from '../services/encryption.service';
import { DockerDatabaseInstanceService } from '../services/docker-database-instance.service';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
const providerService = new ExternalDatabaseProvidersService();
const encryptionService = new EncryptionService();
const databaseInstanceService = new DockerDatabaseInstanceService();

// Aplicar middleware de autenticação em todas as rotas primeiro (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  authMiddleware.requireAuth()(req, res, next);
});

/**
 * POST /api/super-admin/provider-auth/:provider
 * Salvar/atualizar credenciais de autenticação para um provedor
 */
router.post('/:provider', requireSuperAdmin, async (req: Request, res: Response) => {
    const prisma = getPrismaClient();
  try {
    const { provider } = req.params;
    const { token, refreshToken, authType = 'api_key' } = req.body;
    
    // Obter userId do request (já autenticado pelo middleware)
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token/API key is required'
      });
    }

    // Validar formato do provider
    const validProviders = ['railway', 'supabase', 'neon', 'aiven', 'render', 'upstash', 'redis_cloud', 'clever_cloud'];
    if (!validProviders.includes(provider.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid provider. Supported: ${validProviders.join(', ')}`
      });
    }

    // Validar autenticação testando a conexão (não bloqueante para Railway)
    const auth: ProviderAuth = {
      provider: provider.toLowerCase(),
      authType: authType as 'api_key' | 'oauth' | 'service_role',
      token
    };

    try {
      const isValid = await Promise.race([
        providerService.validateProviderAuth(provider, auth),
        new Promise<boolean>((resolve) => 
          setTimeout(() => {
            logger.warn(`Auth validation timeout for ${provider}, allowing save anyway`);
            resolve(true); // Permitir salvar mesmo se validação demorar muito
          }, 12000)
        )
      ]);

      if (!isValid && provider !== 'railway') {
        // Para Railway, sempre permitir salvar mesmo se validação falhar
        // pois a estrutura da API pode variar
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials. Please check your API key/token.'
        });
      }
    } catch (validationError) {
      // Para Railway, não bloquear o salvamento mesmo se houver erro na validação
      if (provider === 'railway') {
        logger.warn(`Railway validation error, but allowing save: ${validationError}`);
      } else {
        logger.error(`Error validating ${provider} auth:`, validationError);
        return res.status(401).json({
          success: false,
          error: 'Error validating credentials. Please try again.'
        });
      }
    }

    // Criptografar token
    const encryptedToken = encryptionService.encrypt(token);
    const encryptedRefreshToken = refreshToken ? encryptionService.encrypt(refreshToken) : null;

    // Salvar ou atualizar
    const providerAuth = await prisma.providerAuthentication.upsert({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase() as any
        }
      },
      create: {
        userId,
        provider: provider.toLowerCase() as any,
        authType,
        encryptedToken,
        encryptedRefreshToken,
        isActive: true
      },
      update: {
        encryptedToken,
        encryptedRefreshToken,
        authType,
        updatedAt: new Date()
      }
    });

    logger.info('Provider authentication saved', { provider, userId });

    // Sincronizar bancos de dados automaticamente após configurar autenticação
    try {
      const token = encryptionService.decrypt(encryptedToken);
      const refreshTokenDecrypted = encryptedRefreshToken ? encryptionService.decrypt(encryptedRefreshToken) : undefined;
      
      const auth: ProviderAuth = {
        provider: provider.toLowerCase(),
        authType: authType as 'api_key' | 'oauth' | 'service_role',
        token,
        refreshToken: refreshTokenDecrypted
      };

      // Buscar bancos do provedor
      const externalDatabases = await providerService.listProviderDatabases(provider, auth);
      
      if (externalDatabases.length > 0) {
        // Sincronizar bancos para o sistema
        const syncedCount = await databaseInstanceService.syncExternalProviderDatabases(
          provider.toLowerCase(),
          externalDatabases,
          userId
        );
        
        logger.info('External databases automatically synced after provider authentication', { 
          provider, 
          userId, 
          total: externalDatabases.length,
          synced: syncedCount
        });
        // Armazenar contagem para resposta
        (req as any).databasesSynced = syncedCount;
      } else {
        logger.info('No databases found for provider', { provider, userId });
        (req as any).databasesSynced = 0;
      }
    } catch (error) {
      // Não falhar a resposta se a sincronização de bancos falhar
      logger.warn('Failed to auto-sync databases after provider authentication', { error, provider, userId });
      (req as any).databasesSynced = 0;
    }

    // Sincronizar custos automaticamente após configurar autenticação
    try {
      const { externalDatabaseCostsService } = await import('../services/external-database-costs.service');
      const costs = await externalDatabaseCostsService.getAllProviderCosts(userId);
      if (costs.length > 0) {
        await externalDatabaseCostsService.syncCostsToSystem(userId, costs);
        logger.info('Costs automatically synced after provider authentication', { provider, userId });
      }
    } catch (error) {
      // Não falhar a resposta se a sincronização de custos falhar
      logger.warn('Failed to auto-sync costs after provider authentication', { error, provider, userId });
    }

    res.json({
      success: true,
      data: {
        id: providerAuth.id,
        provider: providerAuth.provider,
        authType: providerAuth.authType,
        isActive: providerAuth.isActive,
        databasesSynced: (req as any).databasesSynced || 0
      },
      message: 'Provider authentication configured successfully'
    });
  } catch (error) {
    logger.error('Error saving provider auth:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/provider-auth/:provider/databases
 * Listar bancos de dados de um provedor
 */
router.get('/:provider/databases', requireSuperAdmin, async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { provider } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    // Buscar credenciais do usuário para este provedor
    const providerAuthRecord = await prisma.providerAuthentication.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase() as any
        }
      }
    });

    if (!providerAuthRecord || !providerAuthRecord.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Provider authentication not configured. Please configure authentication first.'
      });
    }

    // Descriptografar token
    const token = encryptionService.decrypt(providerAuthRecord.encryptedToken);
    const refreshToken = providerAuthRecord.encryptedRefreshToken 
      ? encryptionService.decrypt(providerAuthRecord.encryptedRefreshToken)
      : undefined;

    const auth: ProviderAuth = {
      provider: provider.toLowerCase(),
      authType: providerAuthRecord.authType as 'api_key' | 'oauth' | 'service_role',
      token,
      refreshToken,
      expiresAt: providerAuthRecord.expiresAt || undefined
    };

    // Listar bancos
    const databases = await providerService.listProviderDatabases(provider, auth);

    res.json({
      success: true,
      data: databases
    });
  } catch (error) {
    logger.error('Error listing provider databases:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/provider-auth/:provider/databases/sync
 * Sincronizar bancos de dados de um provedor com o sistema
 */
router.post('/:provider/databases/sync', requireSuperAdmin, async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { provider } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    // Buscar credenciais do usuário para este provedor
    const providerAuthRecord = await prisma.providerAuthentication.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase() as any
        }
      }
    });

    if (!providerAuthRecord || !providerAuthRecord.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Provider authentication not configured. Please configure authentication first.'
      });
    }

    // Descriptografar token
    const token = encryptionService.decrypt(providerAuthRecord.encryptedToken);
    const refreshToken = providerAuthRecord.encryptedRefreshToken 
      ? encryptionService.decrypt(providerAuthRecord.encryptedRefreshToken)
      : undefined;

    const auth: ProviderAuth = {
      provider: provider.toLowerCase(),
      authType: providerAuthRecord.authType as 'api_key' | 'oauth' | 'service_role',
      token,
      refreshToken,
      expiresAt: providerAuthRecord.expiresAt || undefined
    };

    // Listar bancos do provedor
    const externalDatabases = await providerService.listProviderDatabases(provider, auth);
    
    if (externalDatabases.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum banco de dados encontrado para este provedor',
        data: {
          total: 0,
          synced: 0
        }
      });
    }

    // Sincronizar bancos para o sistema
    const syncedCount = await databaseInstanceService.syncExternalProviderDatabases(
      provider.toLowerCase(),
      externalDatabases,
      userId
    );
    
    logger.info('External databases manually synced', { 
      provider, 
      userId, 
      total: externalDatabases.length,
      synced: syncedCount
    });

    res.json({
      success: true,
      message: `${syncedCount} banco(s) sincronizado(s) com sucesso`,
      data: {
        total: externalDatabases.length,
        synced: syncedCount
      }
    });
  } catch (error) {
    logger.error('Error syncing provider databases:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/provider-auth
 * Listar todas as autenticações configuradas
 */
router.get('/', requireSuperAdmin, async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    const auths = await prisma.providerAuthentication.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        provider: true,
        authType: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Buscar contagem de bancos de dados por provedor
    const authsWithCount = await Promise.all(
      auths.map(async (auth) => {
        const count = await prisma.databaseInstance.count({
          where: {
            provider: auth.provider as any
          }
        });
        
        return {
          ...auth,
          databasesCount: count
        };
      })
    );

    res.json({
      success: true,
      data: authsWithCount
    });
  } catch (error) {
    logger.error('Error listing provider authentications:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/super-admin/provider-auth/:provider
 * Verificar se autenticação de um provedor está configurada
 */
router.get('/:provider', requireSuperAdmin, async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { provider } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    // Buscar credenciais do usuário para este provedor
    const providerAuthRecord = await prisma.providerAuthentication.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: provider.toLowerCase() as any
        }
      }
    });

    if (!providerAuthRecord || !providerAuthRecord.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Provider authentication not configured'
      });
    }

    res.json({
      success: true,
      data: {
        id: providerAuthRecord.id,
        provider: providerAuthRecord.provider,
        authType: providerAuthRecord.authType,
        isActive: providerAuthRecord.isActive
      }
    });
  } catch (error) {
    logger.error('Error checking provider auth:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * DELETE /api/super-admin/provider-auth/:provider
 * Remover autenticação de um provedor
 */
router.delete('/:provider', requireSuperAdmin, async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { provider } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    await prisma.providerAuthentication.deleteMany({
      where: {
        userId,
        provider: provider.toLowerCase() as any
      }
    });

    logger.info('Provider authentication deleted', { provider, userId });

    res.json({
      success: true,
      message: 'Provider authentication removed successfully'
    });
  } catch (error) {
    logger.error('Error deleting provider auth:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/provider-auth/costs/sync
 * Sincronizar custos dos provedores com o sistema de custos principal
 */
router.post('/costs/sync', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }
    
    const { externalDatabaseCostsService } = await import('../services/external-database-costs.service');
    const costs = await externalDatabaseCostsService.getAllProviderCosts(userId);
    
    // Sincronizar com o sistema de custos
    await externalDatabaseCostsService.syncCostsToSystem(userId, costs);

    res.json({
      success: true,
      message: 'Costs synced successfully',
      data: {
        providers: costs.length,
        databases: costs.reduce((sum, c) => sum + c.databases.length, 0)
      }
    });
  } catch (error) {
    logger.error('Error syncing provider costs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * POST /api/super-admin/provider-auth/neon/:projectId/:branchId/activate
 * Ativar branch suspensa do Neon
 */
router.post('/neon/:projectId/:branchId/activate', requireSuperAdmin, async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  try {
    const { projectId, branchId } = req.params;
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in request'
      });
    }

    // Buscar credenciais do usuário para Neon
    const providerAuthRecord = await prisma.providerAuthentication.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'neon'
        }
      }
    });

    if (!providerAuthRecord || !providerAuthRecord.isActive) {
      return res.status(404).json({
        success: false,
        error: 'Neon authentication not configured. Please configure authentication first.'
      });
    }

    // Descriptografar token
    const token = encryptionService.decrypt(providerAuthRecord.encryptedToken);

    const auth: ProviderAuth = {
      provider: 'neon',
      authType: providerAuthRecord.authType as 'api_key' | 'oauth' | 'service_role',
      token
    };

    // Ativar branch
    const result = await providerService.activateNeonBranch(projectId, branchId, auth);

    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    logger.error('Error activating Neon branch:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;

