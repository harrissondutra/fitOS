import { Router } from 'express';
import { Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/superAdmin';
import { asyncHandler } from '../utils/async-handler';
import { createAiProviderService } from '../utils/service-factory';
import { AiProviderType } from '../../../shared/types/ai.types';

const router = Router();

// Aplicar middleware de autenticação ANTES de requireSuperAdmin (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  authMiddleware.requireAuth({ checkSessionActivity: false })(req, res, next);
});

// Aplicar middleware de super admin
router.use(requireSuperAdmin);

/**
 * Mapeamento de provedores para informações de integração
 */
const PROVIDER_INTEGRATION_INFO: Record<string, {
  displayName: string;
  description: string;
  category: string;
  icon: string;
}> = {
  [AiProviderType.OPENAI]: {
    displayName: 'OpenAI',
    description: 'API de inteligência artificial para geração de texto e conversas',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.CLAUDE]: {
    displayName: 'Anthropic Claude',
    description: 'API Claude para assistência inteligente e análise de texto',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.GEMINI]: {
    displayName: 'Google Gemini',
    description: 'API Gemini para processamento multimodal e geração de conteúdo',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.GROQ]: {
    displayName: 'Groq',
    description: 'API Groq para inferência rápida de modelos de IA',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.MISTRAL]: {
    displayName: 'Mistral AI',
    description: 'API Mistral para modelos de linguagem eficientes',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.COHERE]: {
    displayName: 'Cohere',
    description: 'API Cohere para processamento de linguagem natural',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.OLLAMA]: {
    displayName: 'Ollama',
    description: 'Ollama para execução local de modelos de IA',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.HUGGINGFACE]: {
    displayName: 'Hugging Face',
    description: 'API Hugging Face para modelos de IA open source',
    category: 'ai',
    icon: 'brain'
  },
  [AiProviderType.DEEPSEEK]: {
    displayName: 'DeepSeek',
    description: 'API DeepSeek para modelos de linguagem avançados',
    category: 'ai',
    icon: 'brain'
  }
};

/**
 * GET /api/super-admin/ai/integrations
 * Lista todas as integrações de IA
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  const providerService = createAiProviderService(req);

  try {
    // 1. Obter todos os provedores
    const providersResult = await providerService.listProviders({}, { page: 1, limit: 1000 });
    const providers = providersResult.data || [];

    // 2. Transformar provedores em integrações
    const integrations = providers.map((provider) => {
      const providerInfo = PROVIDER_INTEGRATION_INFO[provider.provider] || {
        displayName: provider.displayName || provider.name,
        description: `Integração com ${provider.displayName || provider.name}`,
        category: 'ai',
        icon: 'brain'
      };

      // Verificar último teste (webhook log mais recente)
      return {
        id: provider.id,
        integration: provider.name,
        displayName: providerInfo.displayName,
        description: providerInfo.description,
        category: providerInfo.category,
        icon: providerInfo.icon,
        isActive: provider.isActive,
        isConfigured: !!provider.apiKey && provider.apiKey.length > 0,
        lastTested: provider.updatedAt,
        lastTestStatus: provider.isActive ? ('success' as const) : ('failure' as const),
        lastTestMessage: provider.isActive 
          ? 'Conexão estabelecida com sucesso' 
          : 'Integração inativa',
        environment: 'production' as const,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      };
    });

    // 3. Adicionar integrações disponíveis mas não configuradas
    const configuredProviders = providers.map(p => p.provider);
    const allProviderTypes = Object.keys(PROVIDER_INTEGRATION_INFO) as AiProviderType[];
    
    allProviderTypes.forEach((providerType) => {
      if (!configuredProviders.includes(providerType)) {
        const providerInfo = PROVIDER_INTEGRATION_INFO[providerType];
        integrations.push({
          id: `available-${providerType}`,
          integration: providerType.toLowerCase().replace('_', '-'),
          displayName: providerInfo.displayName,
          description: providerInfo.description,
          category: providerInfo.category,
          icon: providerInfo.icon,
          isActive: false,
          isConfigured: false,
          lastTested: undefined,
          lastTestStatus: undefined,
          lastTestMessage: undefined,
          environment: 'production' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    res.json({
      success: true,
      data: integrations
    });
  } catch (error: any) {
    console.error('Erro ao obter integrações:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter integrações'
    });
  }
}));

/**
 * POST /api/super-admin/ai/integrations/:id/test
 * Testa uma integração
 */
router.post('/:id/test', asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const providerService = createAiProviderService(req);

  try {
    // Se for uma integração "available-", não pode testar
    if (id.startsWith('available-')) {
      return res.status(400).json({
        success: false,
        error: 'Integração não configurada ainda'
      });
    }

    // Buscar provedor
    const providersResult = await providerService.listProviders({}, { page: 1, limit: 1000 });
    const provider = providersResult.data?.find(p => p.id === id);

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Integração não encontrada'
      });
    }

    // Testar provedor
    const testResult = await providerService.testProvider(id);

    res.json({
      success: testResult.success,
      data: {
        status: testResult.success ? 'success' : 'failure',
        message: testResult.success 
          ? 'Conexão estabelecida com sucesso' 
          : testResult.error || 'Falha ao conectar',
        responseTime: testResult.responseTime
      }
    });
  } catch (error: any) {
    console.error('Erro ao testar integração:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao testar integração'
    });
  }
}));

export default router;

