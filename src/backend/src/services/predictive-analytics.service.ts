/**
 * Predictive Analytics Service
 * 
 * Serviço central para gerenciamento de modelos preditivos,
 * execução de predições e rastreamento de acurácia.
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { AiServiceType } from '../../../shared/types/ai.types';
import { AiClientFactory } from './ai-client.factory';
import { AiProviderService } from './ai-provider.service';
import { AiCostTrackingService } from './ai-cost-tracking.service';
import { PlanLimitsService } from './plan-limits.service';
import { logger } from '../utils/logger';

export interface PredictionInput {
  serviceType: AiServiceType;
  tenantId: string;
  userId?: string;
  data: Record<string, any>;
}

export interface PredictionResult {
  predictionId: string;
  serviceType: AiServiceType;
  prediction: any;
  confidence?: number;
  metadata?: Record<string, any>;
}

export class PredictiveAnalyticsService {
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
   * Executa uma predição usando o modelo configurado
   */
  async executePrediction(input: PredictionInput): Promise<PredictionResult> {
    try {
      // 1. Verificar se feature está habilitada no plano (se não for SUPER_ADMIN)
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: input.tenantId },
        select: { tenantType: true }
      });

      if (tenant?.tenantType !== 'system') {
        const hasFeature = await this.planLimitsService.checkFeatureAccess(
          input.tenantId,
          'ai-predictions'
        );

        if (!hasFeature) {
          throw new Error('Feature de predições não habilitada no seu plano de assinatura');
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

      // 5. Buscar ou criar modelo para o serviço
      const model = await this.getOrCreateModel(input.serviceType, input.tenantId);

      // 6. Construir prompt baseado no tipo de serviço
      const prompt = this.buildPredictionPrompt(input.serviceType, input.data);

      // 7. Resolver provedor para o serviço
      const provider = await this.aiProviderService.resolveProviderWithFallback(
        input.serviceType,
        undefined,
        input.tenantId
      );

      if (!provider) {
        throw new Error(`No provider configured for service type: ${input.serviceType}`);
      }

      // 8. Executar predição via AI Client
      const startTime = Date.now();
      const response = await this.aiClientFactory.executeCompletion(
        provider,
        input.serviceType,
        prompt,
        {
          temperature: 0.5, // Mais determinístico para predições
          maxTokens: 2000
        }
      );

      // 9. Rastrear custo
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

      // 10. Parsear resposta
      const parsed = this.parsePredictionResponse(response.content, input.serviceType);
      
      // 11. Salvar execução
      const execution = await this.prisma.predictionExecution.create({
        data: {
          modelId: model.id,
          tenantId: input.tenantId,
          userId: input.userId,
          inputData: input.data,
          prediction: parsed.prediction,
          confidence: parsed.confidence,
          executedAt: new Date()
        }
      });

      logger.info('Prediction executed', {
        executionId: execution.id,
        serviceType: input.serviceType,
        responseTime: Date.now() - startTime
      });

      return {
        predictionId: execution.id,
        serviceType: input.serviceType,
        prediction: parsed.prediction,
        confidence: parsed.confidence,
        metadata: {
          modelId: model.id,
          executionId: execution.id,
          responseTime: Date.now() - startTime
        }
      };

    } catch (error) {
      logger.error('Error executing prediction:', error);
      throw error;
    }
  }

  /**
   * Busca ou cria modelo para um serviço
   */
  private async getOrCreateModel(
    serviceType: AiServiceType,
    tenantId: string
  ): Promise<any> {
    // Buscar modelo ativo existente
    const existing = await this.prisma.predictionModel.findFirst({
      where: {
        serviceType: serviceType as string,
        tenantId,
        isActive: true
      }
    });

    if (existing) {
      return existing;
    }

    // Criar novo modelo padrão
    return await this.prisma.predictionModel.create({
      data: {
        serviceType: serviceType as string,
        modelName: `${serviceType}-default`,
        version: '1.0.0',
        tenantId,
        isActive: true,
        config: {},
        metadata: {}
      }
    });
  }

  /**
   * Construir prompt baseado no tipo de serviço
   */
  private buildPredictionPrompt(serviceType: AiServiceType, data: Record<string, any>): string {
    const prompts: Record<string, (data: any) => string> = {
      [AiServiceType.PERFORMANCE_PREDICTION]: (d) => `
        Você é um especialista em performance esportiva.
        Analise os dados e forneça uma predição de performance futura.
        
        Dados: ${JSON.stringify(d, null, 2)}
        
        Retorne JSON: { "prediction": { "expectedImprovement": number, "timeline": string, "confidence": number }, "confidence": number }
      `,
      
      [AiServiceType.RECOVERY_TIME_PREDICTION]: (d) => `
        Você é um especialista em recuperação esportiva.
        Prediga o tempo ideal de recuperação baseado nos dados.
        
        Dados: ${JSON.stringify(d, null, 2)}
        
        Retorne JSON: { "prediction": { "recoveryHours": number, "recommendations": string[] }, "confidence": number }
      `,
      
      // Adicionar mais prompts conforme necessário
    };

    const promptBuilder = prompts[serviceType] || ((d) => `
      Analise os dados fornecidos e forneça uma predição.
      Dados: ${JSON.stringify(d, null, 2)}
      Retorne JSON com "prediction" e "confidence".
    `);

    return promptBuilder(data);
  }

  /**
   * Parsear resposta da IA
   */
  private parsePredictionResponse(
    content: string,
    serviceType: AiServiceType
  ): { prediction: any; confidence?: number } {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          prediction: parsed.prediction || parsed,
          confidence: parsed.confidence || undefined
        };
      }
      
      // Fallback: retornar conteúdo como string
      return { prediction: content };
    } catch (error) {
      logger.warn('Failed to parse prediction response, returning raw content');
      return { prediction: content };
    }
  }

  /**
   * Registra resultado real para validação
   */
  async validatePrediction(
    executionId: string,
    actualResult: any
  ): Promise<void> {
    const execution = await this.prisma.predictionExecution.findUnique({
      where: { id: executionId }
    });

    if (!execution) {
      throw new Error('Prediction execution not found');
    }

    // Calcular acurácia (lógica simples - pode ser melhorada)
    const accuracy = this.calculateAccuracy(execution.prediction, actualResult);

    await this.prisma.predictionExecution.update({
      where: { id: executionId },
      data: {
        actualResult,
        accuracy
      }
    });

    logger.info('Prediction validated', {
      executionId,
      accuracy
    });
  }

  /**
   * Calcula acurácia (método simples - pode ser melhorado)
   */
  private calculateAccuracy(prediction: any, actual: any): number {
    // Implementação básica - deve ser adaptada por tipo de predição
    if (typeof prediction === 'number' && typeof actual === 'number') {
      const diff = Math.abs(prediction - actual);
      const max = Math.max(Math.abs(prediction), Math.abs(actual), 1);
      return Math.max(0, 1 - (diff / max));
    }
    
    // Comparação de objetos/strings
    return prediction === actual ? 1.0 : 0.0;
  }

  /**
   * Lista execuções de predição
   */
  async listExecutions(
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
      ...(filters?.serviceType && {
        model: {
          serviceType: filters.serviceType as string
        }
      }),
      ...(filters?.userId && { userId: filters.userId }),
      ...(filters?.startDate && filters?.endDate && {
        executedAt: {
          gte: filters.startDate,
          lte: filters.endDate
        }
      })
    };

    const [executions, total] = await Promise.all([
      this.prisma.predictionExecution.findMany({
        where,
        include: {
          model: true
        },
        orderBy: { executedAt: 'desc' },
        skip: ((pagination?.page || 1) - 1) * (pagination?.limit || 20),
        take: pagination?.limit || 20
      }),
      this.prisma.predictionExecution.count({ where })
    ]);

    return {
      data: executions,
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
  private estimateTokenUsage(input: PredictionInput): number {
    // Estimativa conservadora: ~2 tokens por palavra/valor
    const dataSize = JSON.stringify(input.data).length;
    const baseTokens = Math.ceil(dataSize / 4); // ~4 chars por token
    const promptOverhead = 500; // Tokens do prompt base
    const responseEstimate = 500; // Tokens estimados da resposta
    
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

