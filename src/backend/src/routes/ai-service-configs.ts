import { Router } from 'express';
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  CreateAiServiceConfigRequest, 
  UpdateAiServiceConfigRequest,
  PaginatedResponse,
  AiServiceConfig,
  AiServiceType,
  AiProviderType
} from '../../../shared/types/ai.types';
import { asyncHandler } from '../utils/async-handler';
import { requireSuperAdmin } from '../middleware/superAdmin';

const router = Router();
const prisma = new PrismaClient();

// Aplicar middleware de autenticação para todas as rotas
router.use(requireSuperAdmin);

/**
 * GET /api/super-admin/ai-service-configs
 * Lista todas as configurações de serviços com paginação e filtros
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const serviceType = req.query.serviceType as AiServiceType;
  const providerId = req.query.providerId as string;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const where: any = {
    tenantId: req.user?.tenantId || 'global'
  };

  if (serviceType) where.serviceType = serviceType;
  if (providerId) where.providerId = providerId;
  if (isActive !== undefined) where.isActive = isActive;

  const [serviceConfigs, total] = await prisma.$transaction([
    prisma.aiServiceConfig.findMany({
      where,
      skip,
      take,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            displayName: true,
            provider: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { serviceType: 'asc' },
        { priority: 'desc' },
        { createdAt: 'asc' }
      ]
    }),
    prisma.aiServiceConfig.count({ where })
  ]);

  const formattedConfigs = serviceConfigs.map(config => ({
    ...config,
    serviceType: config.serviceType as AiServiceType,
    serviceName: config.serviceName || undefined,
    maxRequestsPerMinute: config.maxRequestsPerMinute || undefined,
    costPerRequest: config.costPerRequest || undefined,
    config: config.config as Record<string, any>,
    provider: {
      id: config.provider.id,
      name: config.provider.name,
      displayName: config.provider.displayName,
      provider: config.provider.provider as AiProviderType,
      tenantId: 'global', // Valor padrão
      models: [],
      isActive: config.provider.isActive,
      isDefault: false,
      isAsync: false,
      timeout: 30000,
      maxRetries: 3,
      config: {},
      headers: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    }
  }));

  const result: PaginatedResponse<AiServiceConfig> = {
    data: formattedConfigs,
    pagination: {
      page,
      limit: pageSize,
      total,
      pages: Math.ceil(total / pageSize)
    }
  };

  return res.json(result);
}));

/**
 * GET /api/super-admin/ai-service-configs/:id
 * Busca configuração específica por ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const serviceConfig = await prisma.aiServiceConfig.findUnique({
    where: { id },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          displayName: true,
          provider: true,
          isActive: true,
          models: true
        }
      }
    }
  });

  if (!serviceConfig) {
    return res.status(404).json({
      error: 'Service configuration not found',
      code: 'SERVICE_CONFIG_NOT_FOUND'
    });
  }

  const formattedConfig = {
    ...serviceConfig,
    serviceType: serviceConfig.serviceType as AiServiceType,
    config: serviceConfig.config as Record<string, any>
  };

  return res.json(formattedConfig);
}));

/**
 * POST /api/super-admin/ai-service-configs
 * Cria nova configuração de serviço
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const configData: CreateAiServiceConfigRequest = {
    ...req.body
  };

  // Validações básicas
  if (!configData.serviceType || !configData.providerId) {
    return res.status(400).json({
      error: 'Missing required fields: serviceType, providerId',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Verificar se o provedor existe e está ativo
  const provider = await prisma.aiProvider.findUnique({
    where: { id: configData.providerId }
  });

  if (!provider || !provider.isActive) {
    return res.status(400).json({
      error: 'Provider not found or inactive',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  // Verificar se já existe configuração para este serviço + provedor
  const existingConfig = await prisma.aiServiceConfig.findFirst({
    where: {
      serviceType: configData.serviceType,
      providerId: configData.providerId,
      tenantId: req.user?.tenantId || 'global'
    }
  });

  if (existingConfig) {
    return res.status(409).json({
      error: 'Service configuration already exists for this provider',
      code: 'SERVICE_CONFIG_EXISTS'
    });
  }

  const newConfig = await prisma.aiServiceConfig.create({
    data: {
      ...configData,
      tenantId: req.user?.tenantId || 'global',
      config: configData.config as any,
      serviceName: configData.serviceName || `${configData.serviceType} - ${provider.displayName}`
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          displayName: true,
          provider: true,
          isActive: true
        }
      }
    }
  });

  const formattedConfig = {
    ...newConfig,
    serviceType: newConfig.serviceType as AiServiceType,
    config: newConfig.config as Record<string, any>
  };

  return res.status(201).json(formattedConfig);
}));

/**
 * PUT /api/super-admin/ai-service-configs/:id
 * Atualiza configuração existente
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateAiServiceConfigRequest = {
    ...req.body,
    id
  };

  const existingConfig = await prisma.aiServiceConfig.findUnique({
    where: { id }
  });

  if (!existingConfig) {
    return res.status(404).json({
      error: 'Service configuration not found',
      code: 'SERVICE_CONFIG_NOT_FOUND'
    });
  }

  const updatedConfig = await prisma.aiServiceConfig.update({
    where: { id },
    data: {
      ...updateData,
      config: updateData.config as any
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          displayName: true,
          provider: true,
          isActive: true
        }
      }
    }
  });

  const formattedConfig = {
    ...updatedConfig,
    serviceType: updatedConfig.serviceType as AiServiceType,
    config: updatedConfig.config as Record<string, any>
  };

  return res.json(formattedConfig);
}));

/**
 * DELETE /api/super-admin/ai-service-configs/:id
 * Remove configuração (soft delete - marca como inativa)
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingConfig = await prisma.aiServiceConfig.findUnique({
    where: { id }
  });

  if (!existingConfig) {
    return res.status(404).json({
      error: 'Service configuration not found',
      code: 'SERVICE_CONFIG_NOT_FOUND'
    });
  }

  // Soft delete - marcar como inativo
  const updatedConfig = await prisma.aiServiceConfig.update({
    where: { id },
    data: { isActive: false }
  });

  return res.json({
    message: 'Service configuration deactivated successfully',
    config: updatedConfig
  });
}));

/**
 * GET /api/super-admin/ai-service-configs/by-service/:serviceType
 * Lista configurações por tipo de serviço
 */
router.get('/by-service/:serviceType', asyncHandler(async (req: Request, res: Response) => {
  const { serviceType } = req.params;

  if (!Object.values(AiServiceType).includes(serviceType as AiServiceType)) {
    return res.status(400).json({
      error: 'Invalid service type',
      code: 'INVALID_SERVICE_TYPE',
      validTypes: Object.values(AiServiceType)
    });
  }

  const configs = await prisma.aiServiceConfig.findMany({
    where: {
      serviceType: serviceType as AiServiceType,
      tenantId: req.user?.tenantId || 'global',
      isActive: true
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          displayName: true,
          provider: true,
          isActive: true
        }
      }
    },
    orderBy: { priority: 'desc' }
  });

  const formattedConfigs = configs.map(config => ({
    ...config,
    serviceType: config.serviceType as AiServiceType,
    config: config.config as Record<string, any>
  }));

  return res.json({
    serviceType,
    configs: formattedConfigs,
    count: configs.length
  });
}));

/**
 * GET /api/super-admin/ai-service-configs/by-provider/:providerId
 * Lista configurações por provedor
 */
router.get('/by-provider/:providerId', asyncHandler(async (req: Request, res: Response) => {
  const { providerId } = req.params;

  const configs = await prisma.aiServiceConfig.findMany({
    where: {
      providerId,
      tenantId: req.user?.tenantId || 'global',
      isActive: true
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          displayName: true,
          provider: true,
          isActive: true
        }
      }
    },
    orderBy: [
      { serviceType: 'asc' },
      { priority: 'desc' }
    ]
  });

  const formattedConfigs = configs.map(config => ({
    ...config,
    serviceType: config.serviceType as AiServiceType,
    config: config.config as Record<string, any>
  }));

  return res.json({
    providerId,
    configs: formattedConfigs,
    count: configs.length
  });
}));

/**
 * POST /api/super-admin/ai-service-configs/:id/duplicate
 * Duplica configuração existente
 */
router.post('/:id/duplicate', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newServiceName, newProviderId } = req.body;

  const existingConfig = await prisma.aiServiceConfig.findUnique({
    where: { id }
  });

  if (!existingConfig) {
    return res.status(404).json({
      error: 'Service configuration not found',
      code: 'SERVICE_CONFIG_NOT_FOUND'
    });
  }

  const duplicatedConfig = await prisma.aiServiceConfig.create({
    data: {
      serviceType: existingConfig.serviceType,
      serviceName: newServiceName || `${existingConfig.serviceName} (Copy)`,
      providerId: newProviderId || existingConfig.providerId,
      tenantId: existingConfig.tenantId,
      model: existingConfig.model,
      priority: existingConfig.priority - 1, // Menor prioridade
      isActive: true,
      config: existingConfig.config as any,
      maxRequestsPerMinute: existingConfig.maxRequestsPerMinute,
      costPerRequest: existingConfig.costPerRequest
    },
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          displayName: true,
          provider: true,
          isActive: true
        }
      }
    }
  });

  const formattedConfig = {
    ...duplicatedConfig,
    serviceType: duplicatedConfig.serviceType as AiServiceType,
    config: duplicatedConfig.config as Record<string, any>
  };

  return res.status(201).json({
    message: 'Service configuration duplicated successfully',
    config: formattedConfig
  });
}));

/**
 * GET /api/super-admin/ai-service-configs/stats/summary
 * Estatísticas resumidas das configurações
 */
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId || 'global';

  const total = await prisma.aiServiceConfig.count({ where: { tenantId } });
  const active = await prisma.aiServiceConfig.count({ where: { tenantId, isActive: true } });
  const byServiceType = await prisma.$queryRaw`
    SELECT "serviceType", COUNT(*) as count 
    FROM "fitos"."ai_service_configs" 
    WHERE "tenant_id" = ${tenantId} AND "is_active" = true
    GROUP BY "serviceType"
    ORDER BY "serviceType" ASC
  ` as Array<{ serviceType: string; count: bigint }>;
  const byProvider = await prisma.$queryRaw`
    SELECT "provider_id", COUNT(*) as count 
    FROM "fitos"."ai_service_configs" 
    WHERE "tenant_id" = ${tenantId} AND "is_active" = true
    GROUP BY "provider_id"
    ORDER BY "provider_id" ASC
  ` as Array<{ provider_id: string; count: bigint }>;

  const byServiceTypeMap = byServiceType.reduce((acc, item) => {
    acc[item.serviceType] = Number(item.count);
    return acc;
  }, {} as Record<string, number>);

  const byProviderMap = byProvider.reduce((acc, item) => {
    acc[item.provider_id] = {
      count: Number(item.count),
      providerName: 'Unknown' // Não temos acesso ao provider no raw query
    };
    return acc;
  }, {} as Record<string, { count: number; providerName: string }>);

  return res.json({
    total,
    active,
    inactive: total - active,
    byServiceType: byServiceTypeMap,
    byProvider: byProviderMap
  });
}));

export default router;
