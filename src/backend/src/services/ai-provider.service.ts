import { PrismaClient } from '@prisma/client';
import { 
  AiProvider, 
  AiProviderType, 
  AiServiceType, 
  CreateAiProviderRequest, 
  UpdateAiProviderRequest,
  AiProviderFilters,
  PaginationParams,
  PaginatedResponse
} from '../../../shared/types/ai.types';
import { EncryptionService } from './encryption.service';
const encryptionService = new EncryptionService();

/**
 * AiProviderService - CRUD e resolução de provedores de IA
 * 
 * Gerencia provedores de IA com criptografia de chaves,
 * resolução por serviço e fallback automático.
 */
export class AiProviderService {
  private prisma: PrismaClient | any; // Aceita PrismaClient ou PrismaTenantWrapper

  constructor(prisma?: PrismaClient | any) {
    // Se não fornecido, importar getPrismaClient para fallback
    // Mas preferencialmente sempre passar do request via factory
    this.prisma = prisma || (() => {
      const { getPrismaClient } = require('../config/database');
      return getPrismaClient();
    })();
  }

  /**
   * Lista provedores com filtros e paginação
   * @param filters Filtros de busca
   * @param pagination Parâmetros de paginação
   * @returns Lista paginada de provedores
   */
  async listProviders(
    filters: AiProviderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<AiProvider>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = pagination;

    const {
      provider,
      isActive,
      isDefault,
      isAsync,
      search
    } = filters;

    // Construir filtros do Prisma
    const where: any = {};

    if (provider) {
      where.provider = provider;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (typeof isDefault === 'boolean') {
      where.isDefault = isDefault;
    }

    if (typeof isAsync === 'boolean') {
      where.isAsync = isAsync;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Contar total
    const total = await this.prisma.aiProvider.count({ where });

    // Buscar dados
    const providers = await this.prisma.aiProvider.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        serviceConfigs: {
          select: {
            id: true,
            serviceType: true,
            serviceName: true,
            model: true,
            isActive: true
          }
        }
      }
    });

    // Mascarar API keys para resposta
    const maskedProviders = providers.map(provider => ({
      ...provider,
      provider: provider.provider as AiProviderType,
      apiKey: provider.apiKey ? encryptionService.maskApiKey(provider.apiKey) : null,
      webhookSecret: provider.webhookSecret ? encryptionService.maskApiKey(provider.webhookSecret) : null,
      webhookUrl: provider.webhookUrl,
      baseUrl: provider.baseUrl,
      callbackUrl: provider.callbackUrl,
      models: Array.isArray(provider.models) ? provider.models as string[] : [],
      headers: provider.headers as Record<string, string> | null,
      config: provider.config as Record<string, any>
    })) as AiProvider[];

    return {
      data: maskedProviders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Busca provedor por ID
   * @param id ID do provedor
   * @param includeDecrypted Se deve incluir chaves descriptografadas
   * @returns Provedor encontrado
   */
  async getProviderById(id: string, includeDecrypted: boolean = false): Promise<AiProvider | null> {
    const provider = await this.prisma.aiProvider.findUnique({
      where: { id },
      include: {
        serviceConfigs: {
          select: {
            id: true,
            serviceType: true,
            serviceName: true,
            model: true,
            priority: true,
            isActive: true,
            config: true,
            maxRequestsPerMinute: true,
            costPerRequest: true
          }
        }
      }
    });

    if (!provider) {
      return null;
    }

    // Descriptografar chaves se solicitado
    let apiKey = provider.apiKey;
    let webhookSecret = provider.webhookSecret;

    if (includeDecrypted) {
      if (apiKey && encryptionService.isEncrypted(apiKey)) {
        apiKey = encryptionService.decrypt(apiKey);
      }
      if (webhookSecret && encryptionService.isEncrypted(webhookSecret)) {
        webhookSecret = encryptionService.decrypt(webhookSecret);
      }
    } else {
      // Mascarar chaves
      apiKey = apiKey ? encryptionService.maskApiKey(apiKey) : null;
      webhookSecret = webhookSecret ? encryptionService.maskApiKey(webhookSecret) : null;
    }

    return {
      ...provider,
      provider: provider.provider as AiProviderType,
      apiKey,
      webhookSecret,
      webhookUrl: provider.webhookUrl,
      baseUrl: provider.baseUrl,
      callbackUrl: provider.callbackUrl,
      models: Array.isArray(provider.models) ? provider.models as string[] : [],
      headers: provider.headers as Record<string, string> | null,
      config: provider.config as Record<string, any>
    } as AiProvider;
  }

  /**
   * Cria novo provedor
   * @param data Dados do provedor
   * @param createdBy ID do usuário criador
   * @returns Provedor criado
   */
  async createProvider(data: CreateAiProviderRequest, createdBy: string): Promise<AiProvider> {
    // Criptografar chaves sensíveis
    const encryptedData = {
      ...data,
      apiKey: data.apiKey ? encryptionService.encrypt(data.apiKey) : null,
      webhookSecret: data.webhookSecret ? encryptionService.encrypt(data.webhookSecret) : null,
      createdBy
    } as AiProvider;

    // Se é o primeiro provedor ativo, torná-lo padrão
    if (data.isDefault) {
      await this.prisma.aiProvider.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const provider = await this.prisma.aiProvider.create({
      data: {
        ...encryptedData,
        provider: encryptedData.provider as any,
        headers: encryptedData.headers as any
      },
      include: {
        serviceConfigs: true
      }
    });

    // Retornar com chaves mascaradas
    return {
      ...provider,
      provider: provider.provider as AiProviderType,
      apiKey: provider.apiKey ? encryptionService.maskApiKey(provider.apiKey) : null,
      webhookSecret: provider.webhookSecret ? encryptionService.maskApiKey(provider.webhookSecret) : null,
      models: Array.isArray(provider.models) ? provider.models as string[] : [],
      headers: provider.headers as Record<string, string> | undefined,
      config: provider.config as Record<string, any>
    } as AiProvider;
  }

  /**
   * Atualiza provedor existente
   * @param id ID do provedor
   * @param data Dados para atualizar
   * @returns Provedor atualizado
   */
  async updateProvider(id: string, data: UpdateAiProviderRequest): Promise<AiProvider | null> {
    const existingProvider = await this.prisma.aiProvider.findUnique({
      where: { id }
    });

    if (!existingProvider) {
      return null;
    }

    // Preparar dados para atualização
    const updateData: any = { ...data };

    // Criptografar chaves se fornecidas
    if (data.apiKey !== undefined) {
      updateData.apiKey = data.apiKey ? encryptionService.encrypt(data.apiKey) : null;
    }

    if (data.webhookSecret !== undefined) {
      updateData.webhookSecret = data.webhookSecret ? encryptionService.encrypt(data.webhookSecret) : null;
    }

    // Se está sendo definido como padrão, remover padrão dos outros
    if (data.isDefault) {
      await this.prisma.aiProvider.updateMany({
        where: { 
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      });
    }

    const provider = await this.prisma.aiProvider.update({
      where: { id },
      data: updateData,
      include: {
        serviceConfigs: true
      }
    });

    // Retornar com chaves mascaradas
    return {
      ...provider,
      provider: provider.provider as AiProviderType,
      apiKey: provider.apiKey ? encryptionService.maskApiKey(provider.apiKey) : null,
      webhookSecret: provider.webhookSecret ? encryptionService.maskApiKey(provider.webhookSecret) : null,
      models: Array.isArray(provider.models) ? provider.models as string[] : [],
      headers: provider.headers as Record<string, string> | undefined,
      config: provider.config as Record<string, any>
    } as AiProvider;
  }

  /**
   * Remove provedor
   * @param id ID do provedor
   * @returns true se removido com sucesso
   */
  async deleteProvider(id: string): Promise<boolean> {
    try {
      await this.prisma.aiProvider.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Error deleting provider:', error);
      return false;
    }
  }

  /**
   * Resolve provedor para um serviço específico
   * @param serviceType Tipo do serviço
   * @param serviceName Nome específico do serviço (opcional)
   * @param tenantId ID do tenant (opcional)
   * @returns Provedor resolvido com chaves descriptografadas
   */
  async resolveProviderForService(
    serviceType: AiServiceType,
    serviceName?: string,
    tenantId?: string
  ): Promise<AiProvider | null> {
    // Buscar configurações de serviço ativas, ordenadas por prioridade
    const serviceConfigs = await this.prisma.aiServiceConfig.findMany({
      where: {
        serviceType: serviceType as any,
        serviceName: serviceName || null,
        isActive: true
        // provider: {
        //   isActive: true
        // }
      },
      // include: {
      //   provider: true
      // },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    if (serviceConfigs.length === 0) {
      return null;
    }

    // Pegar o primeiro provedor (maior prioridade)
    const serviceConfig = serviceConfigs[0];
    const provider = (serviceConfig as any).provider;

    // Descriptografar chaves
    let apiKey = provider?.apiKey;
    let webhookSecret = provider?.webhookSecret;

    if (apiKey && encryptionService.isEncrypted(apiKey)) {
      apiKey = encryptionService.decrypt(apiKey);
    }

    if (webhookSecret && encryptionService.isEncrypted(webhookSecret)) {
      webhookSecret = encryptionService.decrypt(webhookSecret);
    }

    return {
      ...provider,
      provider: provider.provider as AiProviderType,
      apiKey,
      webhookSecret,
      models: Array.isArray(provider.models) ? provider.models as string[] : [],
      headers: provider.headers as Record<string, string> | undefined,
      config: provider.config as Record<string, any>
    } as AiProvider;
  }

  /**
   * Resolve provedor com fallback automático
   * @param serviceType Tipo do serviço
   * @param serviceName Nome específico do serviço (opcional)
   * @param tenantId ID do tenant (opcional)
   * @returns Provedor principal ou fallback
   */
  async resolveProviderWithFallback(
    serviceType: AiServiceType,
    serviceName?: string,
    tenantId?: string
  ): Promise<AiProvider | null> {
    // Tentar resolver provedor específico primeiro
    const provider = await this.resolveProviderForService(serviceType, serviceName, tenantId);

    if (provider) {
      return provider;
    }

    // Se não encontrou, tentar com provedor padrão
    const defaultProvider = await this.prisma.aiProvider.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    });

    if (defaultProvider) {
      // Descriptografar chaves
      let apiKey = defaultProvider.apiKey;
      let webhookSecret = defaultProvider.webhookSecret;

      if (apiKey && encryptionService.isEncrypted(apiKey)) {
        apiKey = encryptionService.decrypt(apiKey);
      }

      if (webhookSecret && encryptionService.isEncrypted(webhookSecret)) {
        webhookSecret = encryptionService.decrypt(webhookSecret);
      }

      return {
        ...defaultProvider,
        provider: defaultProvider.provider as AiProviderType,
        apiKey,
        webhookSecret,
        models: Array.isArray(defaultProvider.models) ? defaultProvider.models as string[] : [],
        config: defaultProvider.config as Record<string, any>
      } as AiProvider;
    }

    return null;
  }

  /**
   * Testa conectividade de um provedor
   * @param id ID do provedor
   * @returns Resultado do teste
   */
  async testProvider(id: string): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const provider = await this.getProviderById(id, true);

    if (!provider) {
      return { success: false, error: 'Provider not found' };
    }

    const startTime = Date.now();

    try {
      // Implementar teste específico por tipo de provedor
      switch (provider.provider) {
        case AiProviderType.OPENAI:
          return await this.testOpenAIProvider(provider);
        case AiProviderType.GROQ:
          return await this.testGroqProvider(provider);
        case AiProviderType.GEMINI:
          return await this.testGeminiProvider(provider);
        case AiProviderType.DEEPSEEK:
          return await this.testDeepSeekProvider(provider);
        default:
          return { success: false, error: 'Provider type not supported for testing' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Testa uma configuração de provedor (sem persistir no banco)
   * @param providerConfig Objeto com provider, apiKey, baseUrl, models, etc.
   */
  async testProviderConfig(providerConfig: any): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const tmpProvider: any = {
      id: 'temp',
      provider: providerConfig?.provider as AiProviderType,
      apiKey: providerConfig?.apiKey,
      baseUrl: (providerConfig?.baseUrl || '').replace(/\/$/, ''),
      models: providerConfig?.models || [],
      headers: providerConfig?.headers || undefined,
      config: providerConfig?.config || {},
      webhookSecret: null
    } as any;

    const startTime = Date.now();
    try {
      switch (tmpProvider.provider) {
        case 'OPEN': // fallback if someone passes wrong key
        case AiProviderType.OPENAI:
          return await this.testOpenAIProvider(tmpProvider as any);
        case AiProviderType.GROQ:
          return await this.testGroqProvider(tmpProvider as any);
        case AiProviderType.GEMINI:
          return await this.testGeminiProvider(tmpProvider as any);
        case AiProviderType.DEEPSEEK:
          return await this.testDeepSeekProvider(tmpProvider as any);
        default:
          return { success: false, error: 'Provider type not supported for testing', name: undefined } as any;
      }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
        responseTime: Date.now() - startTime
      } as any;
    }
  }

  /**
   * Testa provedor OpenAI
   */
  private async testOpenAIProvider(provider: AiProvider): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${provider.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Testa provedor Groq
   */
  private async testGroqProvider(provider: AiProvider): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${provider.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Testa provedor Gemini
   */
  private async testGeminiProvider(provider: AiProvider): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${provider.baseUrl}/models?key=${provider.apiKey}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        success: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Testa provedor DeepSeek
   */
  private async testDeepSeekProvider(provider: AiProvider): Promise<{ success: boolean; error?: string; responseTime?: number }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          // Se não conseguir fazer parse do JSON, usar mensagem padrão
        }

        switch (response.status) {
          case 401:
            throw new Error('Chave API inválida ou expirada');
          case 403:
            throw new Error('Acesso negado. Verifique as permissões da sua chave API');
          case 429:
            throw new Error('Rate limit excedido. Tente novamente em alguns minutos');
          case 500:
            throw new Error('Erro interno do servidor DeepSeek');
          default:
            throw new Error(`DeepSeek API error: ${errorMessage}`);
        }
      }

      const data = await response.json();
      
      return {
        success: true,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log do erro para debugging
      console.error('DeepSeek provider test failed:', {
        providerId: provider.id,
        error: errorMessage,
        responseTime: Date.now() - startTime
      });

      return {
        success: false,
        error: errorMessage,
        responseTime: Date.now() - startTime
      };
    }
  }

  /**
   * Rotaciona chave de API de um provedor
   * @param id ID do provedor
   * @param newApiKey Nova chave de API
   * @returns Provedor atualizado
   */
  async rotateApiKey(id: string, newApiKey: string): Promise<AiProvider | null> {
    return this.updateProvider(id, { id, apiKey: newApiKey });
  }

  /**
   * Lista provedores por tipo
   * @param providerType Tipo do provedor
   * @returns Lista de provedores do tipo especificado
   */
  async getProvidersByType(providerType: AiProviderType): Promise<AiProvider[]> {
    const providers = await this.prisma.aiProvider.findMany({
      where: {
        provider: providerType as any,
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return providers.map(provider => ({
      ...provider,
      provider: provider.provider as AiProviderType,
      apiKey: provider.apiKey ? encryptionService.maskApiKey(provider.apiKey) : null,
      webhookSecret: provider.webhookSecret ? encryptionService.maskApiKey(provider.webhookSecret) : null,
      models: Array.isArray(provider.models) ? provider.models as string[] : [],
      headers: provider.headers as Record<string, string> | undefined
    })) as AiProvider[];
  }

  /**
   * Obtém estatísticas dos provedores
   * @returns Estatísticas agregadas
   */
  async getProviderStats(): Promise<{
    total: number;
    active: number;
    byType: Record<string, number>;
    defaultProvider?: string;
  }> {
    const [total, active, byType, defaultProvider] = await Promise.all([
      this.prisma.aiProvider.count(),
      this.prisma.aiProvider.count({ where: { isActive: true } }),
      this.prisma.aiProvider.groupBy({
        by: ['provider'],
        _count: { provider: true }
      }),
      this.prisma.aiProvider.findFirst({
        where: { isDefault: true },
        select: { id: true, displayName: true }
      })
    ]);

    const byTypeMap = byType.reduce((acc, item) => {
      acc[item.provider] = item._count.provider;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      byType: byTypeMap,
      defaultProvider: defaultProvider?.displayName
    };
  }
}

// Exportar instância padrão (mantido para compatibilidade)
// Preferir usar createAiProviderService(req) nas rotas para tenant context
export const aiProviderService = new AiProviderService();
