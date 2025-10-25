import { PrismaClient } from '@prisma/client';
import { config } from '../config/config-simple';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface UsageData {
  quantity: number;
  unit: string;
  metadata?: any;
}

export interface TrackUsageInput {
  categoryName: string;
  serviceName: string;
  usage: UsageData;
  tenantId?: string;
  clientId?: string;
  createdBy?: string;
}

export class CostTrackerService {
  /**
   * Rastrear uso de qualquer serviço automaticamente
   */
  async trackUsage(input: TrackUsageInput): Promise<void> {
    try {
      const { categoryName, serviceName, usage, tenantId, clientId, createdBy } = input;

      // Buscar categoria e serviço
      const category = await prisma.costCategory.findUnique({
        where: { name: categoryName },
      });

      if (!category) {
        logger.warn(`Category not found: ${categoryName}`);
        return;
      }

      const service = await prisma.costService.findFirst({
        where: {
          categoryId: category.id,
          name: serviceName,
        },
      });

      if (!service) {
        logger.warn(`Service not found: ${serviceName} in category ${categoryName}`);
        return;
      }

      // Calcular custo baseado no pricing model
      const cost = await this.calculateCost(service.id, usage);

      if (cost <= 0) {
        logger.debug(`No cost calculated for ${serviceName} usage:`, usage);
        return;
      }

      // Criar entrada automática
      await this.createAutomaticEntry({
        categoryId: category.id,
        serviceId: service.id,
        amount: cost,
        currency: config.costs.defaultCurrency,
        description: `Uso automático: ${usage.quantity} ${usage.unit}`,
        metadata: usage.metadata,
        tenantId,
        clientId,
        createdBy,
      });

      logger.info(`Tracked usage for ${serviceName}: ${usage.quantity} ${usage.unit} = ${config.costs.defaultCurrency} ${cost.toFixed(4)}`);
    } catch (error) {
      logger.error('Error tracking usage:', error);
    }
  }

  /**
   * Calcular custo baseado no pricing model do serviço
   */
  async calculateCost(serviceId: string, usage: UsageData): Promise<number> {
    const service = await prisma.costService.findUnique({
      where: { id: serviceId },
    });

    if (!service || !service.pricingModel) {
      return 0;
    }

    const pricing = service.pricingModel as any;
    const { quantity, unit } = usage;

    // Calcular custo baseado no tipo de serviço
    switch (service.name) {
      case 'openai':
        return this.calculateOpenAICost(pricing, usage);
      case 'anthropic':
        return this.calculateAnthropicCost(pricing, usage);
      case 'google-gemini':
        return this.calculateGeminiCost(pricing, usage);
      case 'groq':
        return this.calculateGroqCost(pricing, usage);
      case 'deepseek':
        return this.calculateDeepSeekCost(pricing, usage);
      case 'cloudinary':
        return this.calculateCloudinaryCost(pricing, usage);
      case 'whatsapp':
        return this.calculateWhatsAppCost(pricing, usage);
      case 'email':
        return this.calculateEmailCost(pricing, usage);
      default:
        // Cálculo genérico baseado em pricing model
        return this.calculateGenericCost(pricing, usage);
    }
  }

  /**
   * Calcular custo OpenAI
   */
  private calculateOpenAICost(pricing: any, usage: UsageData): number {
    const { quantity, metadata } = usage;
    const model = metadata?.model || 'gpt-3.5-turbo';
    const inputTokens = metadata?.inputTokens || 0;
    const outputTokens = metadata?.outputTokens || 0;

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    // Preços por 1M tokens
    const inputCost = (inputTokens / 1000000) * modelPricing.input;
    const outputCost = (outputTokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Calcular custo Anthropic
   */
  private calculateAnthropicCost(pricing: any, usage: UsageData): number {
    const { metadata } = usage;
    const model = metadata?.model || 'claude-3.5-sonnet';
    const inputTokens = metadata?.inputTokens || 0;
    const outputTokens = metadata?.outputTokens || 0;

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    const inputCost = (inputTokens / 1000000) * modelPricing.input;
    const outputCost = (outputTokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Calcular custo Google Gemini
   */
  private calculateGeminiCost(pricing: any, usage: UsageData): number {
    const { metadata } = usage;
    const model = metadata?.model || 'gemini-1.5-flash';
    const inputTokens = metadata?.inputTokens || 0;
    const outputTokens = metadata?.outputTokens || 0;

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    const inputCost = (inputTokens / 1000000) * modelPricing.input;
    const outputCost = (outputTokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Calcular custo Groq
   */
  private calculateGroqCost(pricing: any, usage: UsageData): number {
    const { metadata } = usage;
    const model = metadata?.model || 'llama-3.1-70b';
    const inputTokens = metadata?.inputTokens || 0;
    const outputTokens = metadata?.outputTokens || 0;

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    const inputCost = (inputTokens / 1000000) * modelPricing.input;
    const outputCost = (outputTokens / 1000000) * modelPricing.output;

    return inputCost + outputCost;
  }

  /**
   * Calcular custo DeepSeek
   */
  private calculateDeepSeekCost(pricing: any, usage: UsageData): number {
    const { metadata } = usage;
    const model = metadata?.model || 'deepseek-chat';
    const inputTokens = metadata?.inputTokens || 0;
    const outputTokens = metadata?.outputTokens || 0;

    const modelPricing = pricing[model];
    if (!modelPricing) return 0;

    // Aplicar desconto por horário (50% entre 00:30-08:30 UTC)
    const now = new Date();
    const utcHour = now.getUTCHours();
    const isDiscountTime = utcHour >= 0 && utcHour < 8;
    const discount = isDiscountTime ? 0.5 : 1;

    const inputCost = (inputTokens / 1000000) * modelPricing.input * discount;
    const outputCost = (outputTokens / 1000000) * modelPricing.output * discount;

    return inputCost + outputCost;
  }

  /**
   * Calcular custo Cloudinary
   */
  private calculateCloudinaryCost(pricing: any, usage: UsageData): number {
    const { quantity, unit, metadata } = usage;
    let totalCost = 0;

    // Storage (GB/mês)
    if (metadata?.storageGB) {
      totalCost += metadata.storageGB * pricing.storage;
    }

    // Bandwidth (GB)
    if (metadata?.bandwidthGB) {
      totalCost += metadata.bandwidthGB * pricing.bandwidth;
    }

    // Transformations
    if (metadata?.transformations) {
      totalCost += metadata.transformations * pricing.transformations;
    }

    // Uploads (quantidade)
    if (unit === 'upload') {
      // Assumir 1MB por upload em média
      const avgSizeMB = metadata?.avgSizeMB || 1;
      const storageCost = (avgSizeMB / 1024) * pricing.storage; // Converter MB para GB
      totalCost += storageCost;
    }

    return totalCost;
  }

  /**
   * Calcular custo WhatsApp
   */
  private calculateWhatsAppCost(pricing: any, usage: UsageData): number {
    const { quantity } = usage;
    return quantity * pricing.message;
  }

  /**
   * Calcular custo Email
   */
  private calculateEmailCost(pricing: any, usage: UsageData): number {
    const { quantity } = usage;
    return quantity * pricing.email;
  }

  /**
   * Calcular custo genérico
   */
  private calculateGenericCost(pricing: any, usage: UsageData): number {
    const { quantity, unit } = usage;
    
    // Procurar por preço baseado na unidade
    if (pricing[unit]) {
      return quantity * pricing[unit];
    }

    // Procurar por preço baseado em 'per' + unidade
    const perUnitKey = `per${unit.charAt(0).toUpperCase() + unit.slice(1)}`;
    if (pricing[perUnitKey]) {
      return quantity * pricing[perUnitKey];
    }

    // Preço fixo por quantidade
    if (pricing.perUnit) {
      return quantity * pricing.perUnit;
    }

    return 0;
  }

  /**
   * Criar entrada automática no banco
   */
  private async createAutomaticEntry(data: {
    categoryId: string;
    serviceId: string;
    amount: number;
    currency: string;
    description?: string;
    metadata?: any;
    tenantId?: string;
    clientId?: string;
    createdBy?: string;
  }): Promise<void> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    await prisma.costEntry.create({
      data: {
        ...data,
        month,
        year,
        date: now,
        entryType: 'automatic',
        tags: ['auto-tracked'],
      },
    });
  }

  /**
   * Rastrear uso de IA (migrar do sistema existente)
   */
  async trackAIUsage(data: {
    model: string;
    provider: string;
    inputTokens: number;
    outputTokens: number;
    isCacheHit?: boolean;
    metadata?: any;
    tenantId?: string;
    clientId?: string;
    createdBy?: string;
  }): Promise<void> {
    const { model, provider, inputTokens, outputTokens, isCacheHit, metadata, tenantId, clientId, createdBy } = data;

    // Mapear provider para service name
    const providerToService: Record<string, string> = {
      'openai': 'openai',
      'anthropic': 'anthropic',
      'google': 'google-gemini',
      'groq': 'groq',
      'deepseek': 'deepseek',
    };

    const serviceName = providerToService[provider.toLowerCase()];
    if (!serviceName) {
      logger.warn(`Unknown AI provider: ${provider}`);
      return;
    }

    await this.trackUsage({
      categoryName: 'ai',
      serviceName,
      usage: {
        quantity: 1,
        unit: 'request',
        metadata: {
          model,
          inputTokens,
          outputTokens,
          isCacheHit,
          ...metadata,
        },
      },
      tenantId,
      clientId,
      createdBy,
    });
  }

  /**
   * Rastrear uso de Cloudinary
   */
  async trackCloudinaryUsage(data: {
    type: 'upload' | 'transformation' | 'bandwidth';
    quantity: number;
    metadata?: any;
    tenantId?: string;
    clientId?: string;
    createdBy?: string;
  }): Promise<void> {
    const { type, quantity, metadata, tenantId, clientId, createdBy } = data;

    await this.trackUsage({
      categoryName: 'storage',
      serviceName: 'cloudinary',
      usage: {
        quantity,
        unit: type,
        metadata,
      },
      tenantId,
      clientId,
      createdBy,
    });
  }

  /**
   * Rastrear uso de Email
   */
  async trackEmailUsage(data: {
    recipientCount: number;
    metadata?: any;
    tenantId?: string;
    clientId?: string;
    createdBy?: string;
  }): Promise<void> {
    const { recipientCount, metadata, tenantId, clientId, createdBy } = data;

    await this.trackUsage({
      categoryName: 'communication',
      serviceName: 'email',
      usage: {
        quantity: recipientCount,
        unit: 'email',
        metadata,
      },
      tenantId,
      clientId,
      createdBy,
    });
  }

  /**
   * Rastrear uso de WhatsApp
   */
  async trackWhatsAppUsage(data: {
    messageCount: number;
    provider?: string;
    metadata?: any;
    tenantId?: string;
    clientId?: string;
    createdBy?: string;
  }): Promise<void> {
    const { messageCount, metadata, tenantId, clientId, createdBy } = data;

    await this.trackUsage({
      categoryName: 'communication',
      serviceName: 'whatsapp',
      usage: {
        quantity: messageCount,
        unit: 'message',
        metadata,
      },
      tenantId,
      clientId,
      createdBy,
    });
  }
}

export const costTrackerService = new CostTrackerService();
