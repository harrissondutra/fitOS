/**
 * Content Generation Service
 * 
 * Serviço central para geração de conteúdo usando IA,
 * histórico de conteúdo gerado e gestão de templates.
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { AiServiceType } from '../../../shared/types/ai.types';
import { AiClientFactory } from './ai-client.factory';
import { AiProviderService } from './ai-provider.service';
import { AiCostTrackingService } from './ai-cost-tracking.service';
import { PlanLimitsService } from './plan-limits.service';
import { logger } from '../utils/logger';

export interface GenerationInput {
  serviceType: AiServiceType;
  tenantId: string;
  userId?: string;
  input: Record<string, any>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    template?: string;
  };
}

export interface GenerationResult {
  contentId: string;
  serviceType: AiServiceType;
  output: any;
  metadata?: Record<string, any>;
}

export class ContentGenerationService {
  private prisma: PrismaClient;
  private aiClientFactory: AiClientFactory;
  private aiProviderService: AiProviderService;
  private costTrackingService: AiCostTrackingService;
  private planLimitsService: PlanLimitsService;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || getPrismaClient();
    this.aiClientFactory = new AiClientFactory();
    this.aiProviderService = new AiProviderService(this.prisma);
    this.costTrackingService = new AiCostTrackingService();
    this.planLimitsService = new PlanLimitsService(this.prisma);
  }

  /**
   * Gera conteúdo usando IA
   */
  async generateContent(input: GenerationInput): Promise<GenerationResult> {
    try {
      // 1. Verificar se feature está habilitada no plano (se não for SUPER_ADMIN)
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: input.tenantId },
        select: { tenantType: true }
      });

      if (tenant?.tenantType !== 'system') {
        const hasFeature = await this.planLimitsService.checkFeatureAccess(
          input.tenantId,
          'ai-generation'
        );

        if (!hasFeature) {
          throw new Error('Feature de geração de conteúdo não habilitada no seu plano de assinatura');
        }
      }

      // 2. Estimar tokens necessários para verificação de limites
      const estimatedTokens = this.estimateTokenUsage(input);

      // 3. Verificar limite de tokens do plano
      if (tenant?.tenantType !== 'system') {
        const tokenCheck = await this.planLimitsService.checkAITokenLimit(
          input.tenantId,
          estimatedTokens,
          input.serviceType
        );

        if (!tokenCheck.allowed) {
          throw new Error(
            tokenCheck.reason || 
            `Limite de tokens de IA excedido. Uso atual: ${tokenCheck.current}/${tokenCheck.limit === -1 ? 'ilimitado' : tokenCheck.limit}`
          );
        }

        // 4. Verificar limite de custo (estimado)
        const estimatedCost = this.estimateCost(estimatedTokens);
        const costCheck = await this.planLimitsService.checkAICostLimit(
          input.tenantId,
          estimatedCost,
          input.serviceType
        );

        if (!costCheck.allowed) {
          throw new Error(
            costCheck.reason || 
            `Limite de custo de IA excedido. Custo atual: R$ ${costCheck.current.toFixed(2)}/${costCheck.limit === -1 ? 'ilimitado' : `R$ ${costCheck.limit.toFixed(2)}`}`
          );
        }
      }

      // 5. Construir prompt baseado no tipo de serviço
      const prompt = this.buildGenerationPrompt(
        input.serviceType,
        input.input,
        input.options?.template
      );

      // 6. Resolver provedor para o serviço
      const provider = await this.aiProviderService.resolveProviderWithFallback(
        input.serviceType,
        undefined,
        input.tenantId
      );

      if (!provider) {
        throw new Error(`No provider configured for service type: ${input.serviceType}`);
      }

      // 7. Executar geração via AI Client
      const startTime = Date.now();
      const response = await this.aiClientFactory.executeCompletion(
        provider,
        input.serviceType,
        prompt,
        {
          temperature: input.options?.temperature || 0.8,
          maxTokens: input.options?.maxTokens || 2000
        }
      );

      // 8. Rastrear custo
      const usage = response.usage;
      if (usage) {
        await this.costTrackingService.trackUsage({
          clientId: input.tenantId,
          model: response.model || provider.models[0] || 'unknown',
          provider: provider.provider as string,
          inputTokens: usage.promptTokens || 0,
          outputTokens: usage.completionTokens || 0
        });
      }

      // 9. Parsear resposta
      const parsed = this.parseGenerationResponse(response.content, input.serviceType);

      // 10. Salvar conteúdo gerado
      const generated = await this.prisma.generatedContent.create({
        data: {
          serviceType: input.serviceType as string,
          tenantId: input.tenantId,
          userId: input.userId,
          providerId: provider.id,
          model: response.model || provider.models[0] || 'unknown',
          input: input.input,
          output: parsed,
          metadata: {
            responseTime: Date.now() - startTime,
            template: input.options?.template,
            temperature: input.options?.temperature || 0.8
          }
        }
      });

      logger.info('Content generated', {
        contentId: generated.id,
        serviceType: input.serviceType,
        responseTime: Date.now() - startTime
      });

      return {
        contentId: generated.id,
        serviceType: input.serviceType,
        output: parsed,
        metadata: {
          contentId: generated.id,
          responseTime: Date.now() - startTime,
          model: response.model || provider.models[0],
          provider: provider.provider
        }
      };

    } catch (error) {
      logger.error('Error generating content:', error);
      throw error;
    }
  }

  /**
   * Construir prompt baseado no tipo de serviço
   */
  private buildGenerationPrompt(
    serviceType: AiServiceType,
    data: Record<string, any>,
    template?: string
  ): string {
    const prompts: Record<string, (data: any, template?: string) => string> = {
      [AiServiceType.PERSONALIZED_EMAIL_GENERATION]: (d, t) => `
        Você é um especialista em comunicação e marketing.
        Gere um email personalizado com base nos dados fornecidos.
        
        Dados do cliente: ${JSON.stringify(d.client, null, 2)}
        Contexto: ${JSON.stringify(d.context, null, 2)}
        ${t ? `Template: ${t}` : ''}
        
        Gere um email profissional, personalizado e engajador em português brasileiro.
      `,

      [AiServiceType.SOCIAL_MEDIA_CONTENT_GENERATION]: (d, t) => `
        Você é um especialista em marketing para redes sociais.
        Gere um post para redes sociais baseado nos dados fornecidos.
        
        Tema: ${d.theme}
        Tom: ${d.tone || 'profissional'}
        Plataforma: ${d.platform || 'Instagram'}
        ${d.hashtags ? `Hashtags sugeridas: ${d.hashtags.join(', ')}` : ''}
        
        Gere conteúdo engajador e relevante em português brasileiro.
      `,

      [AiServiceType.PROGRESS_REPORT_GENERATION]: (d, t) => `
        Você é um especialista em análise de progresso de treinamento.
        Gere um relatório de progresso profissional baseado nos dados.
        
        Dados do cliente: ${JSON.stringify(d.client, null, 2)}
        Período: ${d.period}
        Métricas: ${JSON.stringify(d.metrics, null, 2)}
        
        Gere um relatório completo, motivador e profissional em português brasileiro.
      `,

      [AiServiceType.ADAPTIVE_WORKOUT_GENERATION]: (d, t) => `
        Você é um especialista em prescrição de treinamento.
        Gere um treino adaptativo baseado no estado atual do cliente.
        
        Perfil do cliente: ${JSON.stringify(d.profile, null, 2)}
        Objetivos: ${JSON.stringify(d.goals, null, 2)}
        Estado atual: ${JSON.stringify(d.currentState, null, 2)}
        Equipamentos disponíveis: ${d.equipment?.join(', ') || 'Todos'}
        
        Gere um treino completo, progressivo e seguro em formato estruturado.
      `,

      [AiServiceType.RECIPE_GENERATION]: (d, t) => `
        Você é um nutricionista e chef especializado.
        Gere uma receita personalizada baseada nos dados fornecidos.
        
        Objetivos nutricionais: ${JSON.stringify(d.nutritionalGoals, null, 2)}
        Restrições alimentares: ${d.restrictions?.join(', ') || 'Nenhuma'}
        Preferências: ${d.preferences?.join(', ') || 'Nenhuma'}
        Macros alvo: ${JSON.stringify(d.macros, null, 2)}
        
        Gere uma receita completa, saborosa e nutritiva em português brasileiro.
      `,

      // Adicionar mais prompts conforme necessário
    };

    const promptBuilder = prompts[serviceType] || ((d, t) => `
      Gere conteúdo baseado nos dados fornecidos.
      Dados: ${JSON.stringify(d, null, 2)}
      ${t ? `Template: ${t}` : ''}
      Retorne o conteúdo gerado de forma clara e profissional.
    `);

    return promptBuilder(data, template);
  }

  /**
   * Parsear resposta da IA
   */
  private parseGenerationResponse(
    content: string,
    serviceType: AiServiceType
  ): any {
    try {
      // Tentar extrair JSON se for um tipo estruturado
      const jsonTypes = [
        AiServiceType.ADAPTIVE_WORKOUT_GENERATION,
        AiServiceType.RECIPE_GENERATION,
        AiServiceType.PERIODIZATION_GENERATION
      ];

      if (jsonTypes.includes(serviceType)) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // Para conteúdo de texto, retornar como está
      return content.trim();
    } catch (error) {
      logger.warn('Failed to parse generation response, returning raw content');
      return content.trim();
    }
  }

  /**
   * Registra feedback do usuário sobre conteúdo gerado
   */
  async submitFeedback(
    contentId: string,
    feedback: {
      rating?: number; // 1-5
      comment?: string;
      improvements?: string[];
    }
  ): Promise<void> {
    const content = await this.prisma.generatedContent.findUnique({
      where: { id: contentId }
    });

    if (!content) {
      throw new Error('Generated content not found');
    }

    await this.prisma.generatedContent.update({
      where: { id: contentId },
      data: {
        quality: feedback.rating,
        feedback: feedback
      }
    });

    logger.info('Feedback submitted', {
      contentId,
      rating: feedback.rating
    });
  }

  /**
   * Lista conteúdo gerado
   */
  async listGeneratedContent(
    tenantId: string,
    filters?: {
      serviceType?: AiServiceType;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ) {
    const where: any = {
      tenantId,
      ...(filters?.serviceType && { serviceType: filters.serviceType as string }),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.startDate && filters?.endDate && {
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      })
    };

    const [content, total] = await Promise.all([
      this.prisma.generatedContent.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              displayName: true,
              provider: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: ((pagination?.page || 1) - 1) * (pagination?.limit || 20),
        take: pagination?.limit || 20
      }),
      this.prisma.generatedContent.count({ where })
    ]);

    return {
      data: content,
      pagination: {
        total,
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
        pages: Math.ceil(total / (pagination?.limit || 20))
      }
    };
  }

  /**
   * Estima uso de tokens baseado no input
   */
  private estimateTokenUsage(input: GenerationInput): number {
    // Estimativa conservadora: ~2 tokens por palavra/valor
    const inputSize = JSON.stringify(input.input).length;
    const baseTokens = Math.ceil(inputSize / 4); // ~4 chars por token
    const promptOverhead = 400; // Tokens do prompt base
    const responseEstimate = input.options?.maxTokens || 2000; // Tokens estimados da resposta
    
    return baseTokens + promptOverhead + responseEstimate;
  }

  /**
   * Estima custo baseado em tokens (preço médio por token)
   */
  private estimateCost(tokens: number): number {
    // Preço médio: ~R$ 0.01 por 1000 tokens (estimativa conservadora)
    return (tokens / 1000) * 0.01;
  }
}

