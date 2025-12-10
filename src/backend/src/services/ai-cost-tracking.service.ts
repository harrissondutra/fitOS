import { getPrismaClient } from '../config/database';
import { calculateCost, getModelPricing, isDiscountTime } from '../config/ai-pricing';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { cache } from '../config/redis';

export interface CostTrackingData {
  id: string;
  clientId: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  currency: string;
  timestamp: Date;
  isCacheHit?: boolean;
  metadata?: Record<string, any>;
}

export interface CostSummary {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  requestCount: number;
  averageCostPerRequest: number;
  costByModel: Record<string, number>;
  costByProvider: Record<string, number>;
  costByClient: Record<string, number>;
  dailyCosts: Array<{
    date: string;
    cost: number;
    requests: number;
  }>;
}

export interface CostAlert {
  id: string;
  clientId: string | null;
  budgetId: string | null;
  alertType: 'WARNING' | 'CRITICAL' | 'LIMIT_REACHED';
  currentCost: number;
  limit: number;
  percentage: number;
  message: string;
  severity: string;
  isActive: boolean;
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AiCostTrackingService {
  private readonly CACHE_KEY_PREFIX: string;
  private readonly CACHE_TTL: number;
  private readonly DEFAULT_CURRENCY: string;
  private _prisma: ReturnType<typeof getPrismaClient> | null = null;

  constructor() {
    // Usar variáveis de ambiente (ZERO hardcode)
    const redisPrefix = process.env.REDIS_KEY_PREFIX || 'fitos:';
    this.CACHE_KEY_PREFIX = `${redisPrefix}costs:ai:`;
    this.CACHE_TTL = parseInt(process.env.COST_CACHE_TTL_DASHBOARD || process.env.COST_CACHE_TTL || '300');
    this.DEFAULT_CURRENCY = process.env.COST_DEFAULT_CURRENCY || 'BRL';
  }

  // Lazy getter para PrismaClient
  private get prisma() {
    if (!this._prisma) {
      this._prisma = getPrismaClient();
    }
    return this._prisma;
  }

  /**
   * Calcula custo usando preços das variáveis de ambiente quando disponível
   */
  private calculateCostFromEnv(
    model: string,
    inputTokens: number,
    outputTokens: number,
    provider: string
  ): number | null {
    try {
      // Tentar usar preços das variáveis de ambiente primeiro
      let inputPricePer1K = 0;
      let outputPricePer1K = 0;

      // Mapear modelos para variáveis de ambiente
      if (provider.toLowerCase() === 'openai') {
        if (model.includes('gpt-4')) {
          inputPricePer1K = parseFloat(process.env.COST_AI_GPT4_INPUT_PER_1K || '0');
          outputPricePer1K = parseFloat(process.env.COST_AI_GPT4_OUTPUT_PER_1K || '0');
        } else if (model.includes('gpt-3.5')) {
          inputPricePer1K = parseFloat(process.env.COST_AI_GPT35_INPUT_PER_1K || '0');
          outputPricePer1K = parseFloat(process.env.COST_AI_GPT35_OUTPUT_PER_1K || '0');
        }
      } else if (provider.toLowerCase() === 'anthropic') {
        inputPricePer1K = parseFloat(process.env.COST_AI_CLAUDE_INPUT_PER_1K || '0');
        outputPricePer1K = parseFloat(process.env.COST_AI_CLAUDE_OUTPUT_PER_1K || '0');
      }

      // Se temos preços das variáveis de ambiente, usar eles
      if (inputPricePer1K > 0 && outputPricePer1K > 0) {
        const inputCost = (inputTokens / 1000) * inputPricePer1K;
        const outputCost = (outputTokens / 1000) * outputPricePer1K;
        return inputCost + outputCost;
      }

      return null; // Fallback para configuração padrão
    } catch (error) {
      logger.warn(`Failed to calculate cost from env vars for ${model}:`, error);
      return null;
    }
  }

  /**
   * Registra o uso de um modelo de IA e calcula o custo
   */
  async trackUsage(data: Omit<CostTrackingData, 'id' | 'cost' | 'currency' | 'timestamp'>): Promise<CostTrackingData> {
    try {
      // 1. Tentar calcular custo usando variáveis de ambiente primeiro
      let cost = this.calculateCostFromEnv(data.model, data.inputTokens, data.outputTokens, data.provider);
      let currency = this.DEFAULT_CURRENCY;

      // 2. Se não conseguir, usar configuração padrão
      if (cost === null) {
        const modelPricing = getModelPricing(data.model, data.provider);
        if (!modelPricing) {
          throw new Error(`Model not found: ${data.model} from provider: ${data.provider}`);
        }

        const isDiscount = isDiscountTime(data.provider);
        cost = calculateCost(
          data.model,
          data.inputTokens,
          data.outputTokens,
          data.provider,
          data.isCacheHit,
          isDiscount
        );
        currency = modelPricing.pricing.standard.currency;
      }

      // 3. Salvar no banco de dados
      const costRecord = await this.prisma.aiCostTracking.create({
        data: {
          clientId: data.clientId,
          model: data.model,
          provider: data.provider,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          cost: cost,
          currency: currency,
          isCacheHit: data.isCacheHit || false,
          metadata: data.metadata || {},
          timestamp: new Date()
        }
      });

      // 4. Invalidar cache relacionado
      await this.invalidateCache(data.clientId);

      // 5. Verificar alertas de limite
      await this.checkCostAlerts(data.clientId);

      logger.info(`AI cost tracked: ${data.model} - ${cost.toFixed(4)} ${currency}`);

      return {
        id: costRecord.id,
        clientId: costRecord.clientId,
        model: costRecord.model,
        provider: costRecord.provider,
        inputTokens: costRecord.inputTokens,
        outputTokens: costRecord.outputTokens,
        cost: costRecord.cost,
        currency: costRecord.currency,
        timestamp: costRecord.timestamp,
        isCacheHit: costRecord.isCacheHit,
        metadata: costRecord.metadata as Record<string, any>
      };
    } catch (error) {
      logger.error('Failed to track AI usage:', error);
      throw error;
    }
  }

  /**
   * Obtém resumo de custos para um período específico com cache Redis
   */
  async getCostSummary(
    startDate: Date,
    endDate: Date,
    clientId?: string,
    provider?: string,
    model?: string
  ): Promise<CostSummary> {
    try {
      // 1. Gerar chave de cache
      const cacheKey = `${this.CACHE_KEY_PREFIX}summary:${startDate.toISOString()}:${endDate.toISOString()}:${clientId || 'all'}:${provider || 'all'}:${model || 'all'}`;

      // 2. Tentar cache Redis primeiro
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        const cached = await cache.get(cacheKey);
        if (cached) {
          logger.info('AI cost summary retrieved from cache');
          return JSON.parse(cached);
        }
      }

      // 3. Buscar dados do banco
      const where: Prisma.AiCostTrackingWhereInput = {
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      };

      if (clientId) where.clientId = clientId;
      if (provider) where.provider = provider;
      if (model) where.model = model;

      const costs = await this.prisma.aiCostTracking.findMany({
        where,
        orderBy: { timestamp: 'asc' }
      });

      // 4. Processar dados
      const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);
      const totalInputTokens = costs.reduce((sum, cost) => sum + cost.inputTokens, 0);
      const totalOutputTokens = costs.reduce((sum, cost) => sum + cost.outputTokens, 0);
      const requestCount = costs.length;

      // Agrupar por modelo
      const costByModel = costs.reduce((acc, cost) => {
        acc[cost.model] = (acc[cost.model] || 0) + cost.cost;
        return acc;
      }, {} as Record<string, number>);

      // Agrupar por provedor
      const costByProvider = costs.reduce((acc, cost) => {
        acc[cost.provider] = (acc[cost.provider] || 0) + cost.cost;
        return acc;
      }, {} as Record<string, number>);

      // Agrupar por cliente
      const costByClient = costs.reduce((acc, cost) => {
        acc[cost.clientId] = (acc[cost.clientId] || 0) + cost.cost;
        return acc;
      }, {} as Record<string, number>);

      // Agrupar por dia
      const dailyCosts = costs.reduce((acc, cost) => {
        const date = cost.timestamp.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { cost: 0, requests: 0 };
        }
        acc[date].cost += cost.cost;
        acc[date].requests += 1;
        return acc;
      }, {} as Record<string, { cost: number; requests: number }>);

      const dailyCostsArray = Object.entries(dailyCosts).map(([date, data]) => ({
        date,
        cost: data.cost,
        requests: data.requests
      })).sort((a, b) => a.date.localeCompare(b.date));

      const summary: CostSummary = {
        totalCost,
        totalInputTokens,
        totalOutputTokens,
        requestCount,
        averageCostPerRequest: requestCount > 0 ? totalCost / requestCount : 0,
        costByModel,
        costByProvider,
        costByClient,
        dailyCosts: dailyCostsArray
      };

      // 5. Armazenar no cache Redis
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        await cache.set(cacheKey, JSON.stringify(summary), this.CACHE_TTL);
        logger.info(`AI cost summary cached for ${this.CACHE_TTL} seconds`);
      }

      return summary;
    } catch (error) {
      logger.error('Failed to get AI cost summary:', error);
      throw error;
    }
  }

  /**
   * Invalida cache relacionado a um cliente
   */
  private async invalidateCache(clientId: string): Promise<void> {
    if (process.env.COST_REDIS_CACHE_ENABLED !== 'true') {
      return;
    }

    try {
      // Buscar todas as chaves relacionadas ao cliente
      const pattern = `${this.CACHE_KEY_PREFIX}*${clientId}*`;
      // Note: Redis keys method not available in current interface
      // For now, we'll skip cache invalidation by pattern
      // TODO: Implement proper cache invalidation when Redis interface is extended
      logger.info(`Cache invalidation skipped for client ${clientId} - pattern matching not available`);
    } catch (error) {
      logger.warn('Failed to invalidate cache:', error);
    }
  }

  /**
   * Obtém histórico de custos com paginação e cache
   */
  async getCostHistory(
    page: number = 1,
    limit: number = 50,
    filters: {
      clientId?: string;
      provider?: string;
      model?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    try {
      // Gerar chave de cache
      const cacheKey = `${this.CACHE_KEY_PREFIX}history:${page}:${limit}:${JSON.stringify(filters)}`;

      // Tentar cache Redis primeiro
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        const cached = await cache.get(cacheKey);
        if (cached) {
          logger.info('AI cost history retrieved from cache');
          return JSON.parse(cached);
        }
      }

      const where: Prisma.AiCostTrackingWhereInput = {};

      if (filters.clientId) where.clientId = filters.clientId;
      if (filters.provider) where.provider = filters.provider;
      if (filters.model) where.model = filters.model;
      if (filters.startDate || filters.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = filters.startDate;
        if (filters.endDate) where.timestamp.lte = filters.endDate;
      }

      const [costs, total] = await Promise.all([
        this.prisma.aiCostTracking.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        this.prisma.aiCostTracking.count({ where })
      ]);

      const result = {
        costs: costs.map(cost => ({
          id: cost.id,
          clientId: cost.clientId,
          model: cost.model,
          provider: cost.provider,
          inputTokens: cost.inputTokens,
          outputTokens: cost.outputTokens,
          cost: cost.cost,
          currency: cost.currency,
          timestamp: cost.timestamp,
          isCacheHit: cost.isCacheHit,
          metadata: cost.metadata as Record<string, any>
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

      // Armazenar no cache Redis
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        await cache.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);
      }

      return result;
    } catch (error) {
      logger.error('Failed to get AI cost history:', error);
      throw error;
    }
  }


  /**
   * Define limite de custos para um cliente
   */
  async setClientCostLimit(clientId: string, monthlyLimit: number, currency: string = 'USD') {
    return this.prisma.clientCostLimit.upsert({
      where: { clientId },
      update: {
        monthlyLimit,
        currency,
        updatedAt: new Date()
      },
      create: {
        clientId,
        monthlyLimit,
        currency,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Obtém limite de custos de um cliente
   */
  async getClientCostLimit(clientId: string) {
    return this.prisma.clientCostLimit.findUnique({
      where: { clientId }
    });
  }

  /**
   * Verifica alertas de custos para um cliente
   */
  async checkCostAlerts(clientId: string): Promise<CostAlert[]> {
    const costLimit = await this.getClientCostLimit(clientId);
    if (!costLimit) return [];

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyCost = await this.getCostSummary(startOfMonth, endOfMonth, clientId);
    const percentage = (monthlyCost.totalCost / costLimit.monthlyLimit) * 100;

    const alerts: CostAlert[] = [];

    // Verificar se atingiu o limite
    if (monthlyCost.totalCost >= costLimit.monthlyLimit) {
      alerts.push({
        id: `limit-reached-${clientId}`,
        clientId,
        budgetId: null,
        alertType: 'LIMIT_REACHED',
        currentCost: monthlyCost.totalCost,
        limit: costLimit.monthlyLimit,
        percentage: 100,
        message: `Cliente atingiu o limite de custos mensal (${costLimit.monthlyLimit} ${costLimit.currency})`,
        severity: 'error',
        isActive: true,
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (percentage >= 90) {
      alerts.push({
        id: `critical-${clientId}`,
        clientId,
        budgetId: null,
        alertType: 'CRITICAL',
        currentCost: monthlyCost.totalCost,
        limit: costLimit.monthlyLimit,
        percentage,
        message: `Cliente próximo do limite de custos (${percentage.toFixed(1)}% usado)`,
        severity: 'critical',
        isActive: true,
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else if (percentage >= 75) {
      alerts.push({
        id: `warning-${clientId}`,
        clientId,
        budgetId: null,
        alertType: 'WARNING',
        currentCost: monthlyCost.totalCost,
        limit: costLimit.monthlyLimit,
        percentage,
        message: `Cliente usando ${percentage.toFixed(1)}% do limite de custos mensal`,
        severity: 'warning',
        isActive: true,
        acknowledgedAt: null,
        acknowledgedBy: null,
        resolvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Salvar alertas no banco
    for (const alert of alerts) {
      await this.prisma.costAlert.upsert({
        where: { id: alert.id },
        update: {
          alertType: alert.alertType,
          currentCost: alert.currentCost,
          percentage: alert.percentage,
          message: alert.message,
          isActive: alert.isActive,
          updatedAt: new Date()
        },
        create: {
          id: alert.id,
          clientId: alert.clientId,
          alertType: alert.alertType,
          currentCost: alert.currentCost,
          limit: alert.limit,
          percentage: alert.percentage,
          message: alert.message,
          isActive: alert.isActive,
          createdAt: alert.createdAt,
          updatedAt: new Date()
        }
      });
    }

    return alerts;
  }

  /**
   * Obtém todos os alertas ativos
   */
  async getActiveAlerts(): Promise<CostAlert[]> {
    const alerts = await this.prisma.costAlert.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return alerts.map(alert => ({
      ...alert,
      alertType: alert.alertType as 'WARNING' | 'CRITICAL' | 'LIMIT_REACHED'
    }));
  }

  /**
   * Obtém projeção de custos baseada no uso atual
   */
  async getCostProjection(clientId?: string, days: number = 30): Promise<{
    projectedCost: number;
    currentDailyAverage: number;
    confidence: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  }> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    const where: Prisma.AiCostTrackingWhereInput = {
      timestamp: { gte: thirtyDaysAgo }
    };

    if (clientId) where.clientId = clientId;

    const costs = await this.prisma.aiCostTracking.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    });

    if (costs.length === 0) {
      return {
        projectedCost: 0,
        currentDailyAverage: 0,
        confidence: 0,
        trend: 'STABLE'
      };
    }

    // Calcular média diária dos últimos 30 dias
    const dailyCosts = costs.reduce((acc, cost) => {
      const date = cost.timestamp.toISOString().split('T')[0];
      const costValue = typeof cost.cost === 'number' ? cost.cost : Number(cost.cost) || 0;
      acc[date] = (acc[date] || 0) + costValue;
      return acc;
    }, {} as Record<string, number>);

    const dailyValues = Object.values(dailyCosts);
    const currentDailyAverage = dailyValues.reduce((sum: number, cost: number) => sum + cost, 0) / dailyValues.length;

    // Calcular tendência
    const firstHalf = dailyValues.slice(0, Math.floor(dailyValues.length / 2));
    const secondHalf = dailyValues.slice(Math.floor(dailyValues.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum: number, cost: number) => sum + cost, 0) / (firstHalf.length || 1);
    const secondHalfAvg = secondHalf.reduce((sum: number, cost: number) => sum + cost, 0) / (secondHalf.length || 1);

    let trend: 'INCREASING' | 'DECREASING' | 'STABLE' = 'STABLE';
    const changePercent = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    if (changePercent > 10) trend = 'INCREASING';
    else if (changePercent < -10) trend = 'DECREASING';

    // Calcular confiança baseada na consistência dos dados
    const variance = dailyValues.reduce((sum: number, cost: number) => sum + Math.pow(cost - currentDailyAverage, 2), 0) / (dailyValues.length || 1);
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / currentDailyAverage;
    const confidence = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));

    const projectedCost = currentDailyAverage * days;

    return {
      projectedCost,
      currentDailyAverage,
      confidence,
      trend
    };
  }

  /**
   * Exporta relatório de custos
   */
  async exportCostReport(
    startDate: Date,
    endDate: Date,
    format: 'CSV' | 'JSON' = 'CSV',
    clientId?: string
  ): Promise<string> {
    const costs = await this.prisma.aiCostTracking.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate },
        ...(clientId && { clientId })
      },
      orderBy: { timestamp: 'asc' }
    });

    if (format === 'JSON') {
      return JSON.stringify(costs, null, 2);
    }

    // Formato CSV
    const headers = [
      'ID',
      'Client ID',
      'Model',
      'Provider',
      'Input Tokens',
      'Output Tokens',
      'Cost',
      'Currency',
      'Timestamp',
      'Cache Hit'
    ];

    const rows = costs.map(cost => [
      cost.id,
      cost.clientId,
      cost.model,
      cost.provider,
      cost.inputTokens,
      cost.outputTokens,
      cost.cost,
      cost.currency,
      cost.timestamp.toISOString(),
      cost.isCacheHit
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const aiCostTrackingService = new AiCostTrackingService();
