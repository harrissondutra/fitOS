import { Router } from 'express';
import { Request, Response } from 'express';
// Import do service direto é mantido para compatibilidade, mas preferimos factory por tenant-context
import { aiProviderService } from '../services/ai-provider.service';
import { createAiProviderService } from '../utils/service-factory';
import { aiClientFactory } from '../services/ai-client.factory';
import { 
  CreateAiProviderRequest, 
  UpdateAiProviderRequest,
  PaginatedResponse,
  AiProvider,
  AiProviderType 
} from '../../../shared/types/ai.types';
import { asyncHandler } from '../utils/async-handler';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/superAdmin';

const router = Router();

// Aplicar middleware de autenticação ANTES de requireSuperAdmin (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  // Desabilitar verificação de sessão para SUPER_ADMIN evitar deslogar
  authMiddleware.requireAuth({ checkSessionActivity: false })(req, res, next);
});

// Aplicar middleware de super admin (depende de req.user do requireAuth)
router.use(requireSuperAdmin);

/**
 * GET /api/super-admin/ai-providers
 * Lista todos os provedores de IA com paginação e filtros
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const providerType = req.query.providerType as AiProviderType;
  const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
  const isDefault = req.query.isDefault === 'true' ? true : req.query.isDefault === 'false' ? false : undefined;

  const filters = {
    providerType,
    isActive,
    isDefault
  };

  const svc = createAiProviderService(req);
  const result = await svc.listProviders(
    filters,
    { page, limit: pageSize }
  );

  res.json(result);
}));

/**
 * GET /api/super-admin/ai-providers/:id
 * Busca provedor específico por ID
 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const includeDecrypted = req.query.includeDecrypted === 'true';

  const svc = createAiProviderService(req);
  const provider = await svc.getProviderById(id);

  if (!provider) {
    return res.status(404).json({ 
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  return res.json(provider);
}));

/**
 * POST /api/super-admin/ai-providers
 * Cria novo provedor de IA
 */
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const providerData: CreateAiProviderRequest = {
    ...req.body,
    createdBy: req.user?.id || 'system'
  };

  // Validações básicas
  if (!providerData.name || !providerData.displayName || !providerData.provider) {
    return res.status(400).json({
      error: 'Missing required fields: name, displayName, provider',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Validar se o nome é único
  const svc = createAiProviderService(req);
  const existingProviders = await svc.listProviders(
    { search: providerData.name },
    { page: 1, limit: 1 }
  );

  const nameExists = existingProviders.data.some(p => p.name === providerData.name);
  if (nameExists) {
    return res.status(409).json({
      error: 'Provider name already exists',
      code: 'PROVIDER_NAME_EXISTS'
    });
  }

  const svc2 = createAiProviderService(req);
  const newProvider = await svc2.createProvider(providerData, req.user?.id || 'system');

  return res.status(201).json(newProvider);
}));

/**
 * PUT /api/super-admin/ai-providers/:id
 * Atualiza provedor existente
 */
router.put('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updateData: UpdateAiProviderRequest = {
    ...req.body,
    id
  };

  const svc = createAiProviderService(req);
  const existingProvider = await svc.getProviderById(id);
  if (!existingProvider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  const svc2 = createAiProviderService(req);
  const updatedProvider = await svc2.updateProvider(id, updateData);

  if (!updatedProvider) {
    return res.status(500).json({
      error: 'Failed to update provider',
      code: 'UPDATE_FAILED'
    });
  }

  return res.json(updatedProvider);
}));

/**
 * PATCH /api/super-admin/ai-providers/:id/toggle-active
 * Ativa ou inativa um provedor (soft delete)
 */
router.patch('/:id/toggle-active', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({
      error: 'isActive must be a boolean',
      code: 'INVALID_REQUEST'
    });
  }

  const svc = createAiProviderService(req);
  const existingProvider = await svc.getProviderById(id);
  if (!existingProvider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  // Verificar se está tentando inativar o provedor padrão
  if (existingProvider.isDefault && !isActive) {
    return res.status(400).json({
      error: 'Cannot deactivate default provider',
      code: 'CANNOT_DEACTIVATE_DEFAULT'
    });
  }

  // Atualizar status ativo/inativo
  const updatedProvider = await svc.updateProvider(id, {
    id,
    isActive
  });

  return res.json({ 
    message: isActive ? 'Provider activated successfully' : 'Provider deactivated successfully',
    provider: updatedProvider
  });
}));

/**
 * DELETE /api/super-admin/ai-providers/:id
 * Remove provedor completamente do banco de dados (hard delete)
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const svc = createAiProviderService(req);
  const existingProvider = await svc.getProviderById(id);
  if (!existingProvider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  // Verificar se é o provedor padrão
  if (existingProvider.isDefault) {
    return res.status(400).json({
      error: 'Cannot delete default provider',
      code: 'CANNOT_DELETE_DEFAULT'
    });
  }

  // Hard delete - remover completamente do banco
  const deleted = await svc.deleteProvider(id);
  
  if (!deleted) {
    return res.status(500).json({
      error: 'Failed to delete provider',
      code: 'DELETE_FAILED'
    });
  }

  return res.json({ 
    message: 'Provider deleted permanently from database',
    success: true
  });
}));

/**
 * POST /api/super-admin/ai-providers/test-config
 * Testa configuração de provedor antes de criar (para wizard)
 */
router.post('/test-config', asyncHandler(async (req: Request, res: Response) => {
  const { provider, apiKey, baseUrl, models } = req.body;

  if (!provider || !apiKey || !baseUrl) {
    return res.status(400).json({
      success: false,
      error: 'Provider, API Key e Base URL são obrigatórios',
      code: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // Criar objeto temporário de provider para teste
  const tempProvider: any = {
    provider,
    apiKey,
    baseUrl,
    models: Array.isArray(models) ? models : (models ? models.split(',').map((m: string) => m.trim()) : []),
    isActive: true
  };

  const svc = createAiProviderService(req);
  const testResult = await svc.testProviderConfig(tempProvider);

  return res.json({
    ...testResult,
    testedAt: new Date().toISOString()
  });
}));

/**
 * POST /api/super-admin/ai-providers/:id/test
 * Testa conexão com o provedor
 */
router.post('/:id/test', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const svc = createAiProviderService(req);
  const provider = await svc.getProviderById(id, true); // Incluir chave descriptografada
  if (!provider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  const svc2 = createAiProviderService(req);
  const testResult = await svc2.testProvider(id);

  return res.json({
    providerId: id,
    providerName: provider.displayName,
    ...testResult,
    testedAt: new Date().toISOString()
  });
}));

/**
 * POST /api/super-admin/ai-providers/:id/rotate-key
 * Rotaciona API key do provedor
 */
router.post('/:id/rotate-key', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { newApiKey } = req.body;

  if (!newApiKey) {
    return res.status(400).json({
      error: 'New API key is required',
      code: 'MISSING_API_KEY'
    });
  }

  const svc = createAiProviderService(req);
  const existingProvider = await svc.getProviderById(id);
  if (!existingProvider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  const svc2 = createAiProviderService(req);
  const updatedProvider = await svc2.rotateApiKey(id, newApiKey);

  if (!updatedProvider) {
    return res.status(500).json({
      error: 'Failed to rotate API key',
      code: 'ROTATE_FAILED'
    });
  }

  return res.json({
    message: 'API key rotated successfully',
    provider: updatedProvider
  });
}));

/**
 * GET /api/super-admin/ai-providers/stats/summary
 * Estatísticas resumidas dos provedores
 */
router.get('/stats/summary', asyncHandler(async (req: Request, res: Response) => {
  const svc = createAiProviderService(req);
  const stats = await svc.getProviderStats();

  res.json(stats);
}));

/**
 * GET /api/super-admin/ai-providers/by-type/:type
 * Lista provedores por tipo específico
 */
router.get('/by-type/:type', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;

  if (!Object.values(AiProviderType).includes(type as AiProviderType)) {
    return res.status(400).json({
      error: 'Invalid provider type',
      code: 'INVALID_PROVIDER_TYPE',
      validTypes: Object.values(AiProviderType)
    });
  }

  const svc = createAiProviderService(req);
  const providers = await svc.listProviders(
    { provider: type as AiProviderType },
    { page: 1, limit: 100 }
  );

  return res.json({
    providerType: type,
    providers: providers.data,
    count: providers.data.length
  });
}));

/**
 * POST /api/super-admin/ai-providers/:id/set-default
 * Define provedor como padrão
 */
router.post('/:id/set-default', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const svc = createAiProviderService(req);
  const provider = await svc.getProviderById(id);
  if (!provider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  // Primeiro, remover padrão atual do mesmo tipo
  const svc2 = createAiProviderService(req);
  const currentDefault = await svc2.listProviders(
    { provider: provider.provider, isDefault: true },
    { page: 1, limit: 1 }
  );

  if (currentDefault.data.length > 0) {
    await svc2.updateProvider(currentDefault.data[0].id, {
      id: currentDefault.data[0].id,
      isDefault: false
    });
  }

  // Definir novo padrão
  const updatedProvider = await svc2.updateProvider(id, {
    id,
    isDefault: true
  });

  return res.json({
    success: true,
    message: 'Default provider updated successfully',
    data: updatedProvider,
    provider: updatedProvider // Mantido para compatibilidade
  });
}));

export default router;
