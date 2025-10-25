import { Router } from 'express';
import { Request, Response } from 'express';
import { aiProviderService } from '../services/ai-provider.service';
import { aiClientFactory } from '../services/ai-client.factory';
import { 
  CreateAiProviderRequest, 
  UpdateAiProviderRequest,
  PaginatedResponse,
  AiProvider,
  AiProviderType 
} from '../../../shared/types/ai.types';
import { asyncHandler } from '../utils/async-handler';
import { requireSuperAdmin } from '../middleware/superAdmin';

const router = Router();

// Aplicar middleware de autenticação para todas as rotas
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

  const result = await aiProviderService.listProviders(
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

  const provider = await aiProviderService.getProviderById(id);

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
  const existingProviders = await aiProviderService.listProviders(
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

  const newProvider = await aiProviderService.createProvider(providerData, req.user?.id || 'system');

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

  const existingProvider = await aiProviderService.getProviderById(id);
  if (!existingProvider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  const updatedProvider = await aiProviderService.updateProvider(id, updateData);

  if (!updatedProvider) {
    return res.status(500).json({
      error: 'Failed to update provider',
      code: 'UPDATE_FAILED'
    });
  }

  return res.json(updatedProvider);
}));

/**
 * DELETE /api/super-admin/ai-providers/:id
 * Remove provedor (soft delete - marca como inativo)
 */
router.delete('/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingProvider = await aiProviderService.getProviderById(id);
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

  // Soft delete - marcar como inativo
  const updatedProvider = await aiProviderService.updateProvider(id, {
    id,
    isActive: false
  });

  return res.json({ 
    message: 'Provider deactivated successfully',
    provider: updatedProvider
  });
}));

/**
 * POST /api/super-admin/ai-providers/:id/test
 * Testa conexão com o provedor
 */
router.post('/:id/test', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const provider = await aiProviderService.getProviderById(id, true); // Incluir chave descriptografada
  if (!provider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  const testResult = await aiProviderService.testProvider(id);

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

  const existingProvider = await aiProviderService.getProviderById(id);
  if (!existingProvider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  const updatedProvider = await aiProviderService.rotateApiKey(id, newApiKey);

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
  const stats = await aiProviderService.getProviderStats();

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

  const providers = await aiProviderService.listProviders(
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

  const provider = await aiProviderService.getProviderById(id);
  if (!provider) {
    return res.status(404).json({
      error: 'Provider not found',
      code: 'PROVIDER_NOT_FOUND'
    });
  }

  // Primeiro, remover padrão atual do mesmo tipo
  const currentDefault = await aiProviderService.listProviders(
    { provider: provider.provider, isDefault: true },
    { page: 1, limit: 1 }
  );

  if (currentDefault.data.length > 0) {
    await aiProviderService.updateProvider(currentDefault.data[0].id, {
      id: currentDefault.data[0].id,
      isDefault: false
    });
  }

  // Definir novo padrão
  const updatedProvider = await aiProviderService.updateProvider(id, {
    id,
    isDefault: true
  });

  return res.json({
    message: 'Default provider updated successfully',
    provider: updatedProvider
  });
}));

export default router;
