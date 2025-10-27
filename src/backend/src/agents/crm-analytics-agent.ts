/**
 * CRM Analytics Agent - FitOS Sprint 4
 * 
 * Agente de IA especializado em análise de dados de CRM, previsão de vendas,
 * identificação de oportunidades e otimização de pipelines.
 */

import { PrismaClient } from '@prisma/client';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';

export interface CRMAnalyticsRequest {
  tenantId: string;
  analysisType: 'sales_forecast' | 'pipeline_optimization' | 'churn_prediction' | 'opportunity_scoring' | 'performance_analysis';
  inputData: {
    // Para sales_forecast
    timeRange?: {
      startDate: string;
      endDate: string;
    };
    forecastPeriod?: number; // em dias
    
    // Para pipeline_optimization
    pipelineId?: string;
    
    // Para churn_prediction
    clientIds?: string[];
    
    // Para opportunity_scoring
    dealIds?: string[];
    
    // Para performance_analysis
    userIds?: string[];
    metrics?: string[];
  };
  filters?: {
    dealStatus?: string[];
    dealStage?: string[];
    clientSegment?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

export interface CRMAnalyticsResponse {
  analysisId: string;
  analysisType: string;
  status: 'success' | 'partial' | 'failed';
  confidence: number;
  results: {
    // Para sales_forecast
    salesForecast?: {
      predictedRevenue: number;
      predictedDeals: number;
      confidenceInterval: {
        lower: number;
        upper: number;
      };
      trends: Array<{
        period: string;
        revenue: number;
        deals: number;
      }>;
      recommendations: string[];
      riskFactors: string[];
    };
    
    // Para pipeline_optimization
    pipelineOptimization?: {
      currentMetrics: {
        totalDeals: number;
        totalValue: number;
        averageDealSize: number;
        conversionRate: number;
        averageDealDuration: number;
      };
      optimizedMetrics: {
        projectedDeals: number;
        projectedValue: number;
        projectedConversionRate: number;
        projectedDuration: number;
      };
      bottlenecks: Array<{
        stage: string;
        issue: string;
        impact: 'low' | 'medium' | 'high';
        recommendation: string;
      }>;
      recommendations: string[];
      priorityActions: Array<{
        action: string;
        impact: 'low' | 'medium' | 'high';
        effort: 'low' | 'medium' | 'high';
        timeline: string;
      }>;
    };
    
    // Para churn_prediction
    churnPrediction?: {
      highRiskClients: Array<{
        clientId: string;
        clientName: string;
        churnProbability: number;
        riskFactors: string[];
        lastActivity: string;
        recommendedActions: string[];
      }>;
      mediumRiskClients: Array<{
        clientId: string;
        clientName: string;
        churnProbability: number;
        riskFactors: string[];
        recommendedActions: string[];
      }>;
      lowRiskClients: Array<{
        clientId: string;
        clientName: string;
        churnProbability: number;
        strengths: string[];
      }>;
      overallChurnRisk: 'low' | 'medium' | 'high';
      recommendations: string[];
    };
    
    // Para opportunity_scoring
    opportunityScoring?: {
      scoredDeals: Array<{
        dealId: string;
        dealTitle: string;
        score: number;
        factors: Array<{
          factor: string;
          weight: number;
          value: number;
          impact: 'positive' | 'negative' | 'neutral';
        }>;
        recommendation: string;
        priority: 'low' | 'medium' | 'high';
      }>;
      scoringFactors: Array<{
        factor: string;
        weight: number;
        description: string;
      }>;
      recommendations: string[];
    };
    
    // Para performance_analysis
    performanceAnalysis?: {
      userPerformance: Array<{
        userId: string;
        userName: string;
        metrics: {
          dealsCreated: number;
          dealsClosed: number;
          revenueGenerated: number;
          conversionRate: number;
          averageDealSize: number;
          averageDealDuration: number;
        };
        score: number;
        strengths: string[];
        improvementAreas: string[];
        recommendations: string[];
      }>;
      teamMetrics: {
        totalDeals: number;
        totalRevenue: number;
        averageConversionRate: number;
        topPerformers: string[];
        underPerformers: string[];
      };
      recommendations: string[];
    };
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    timestamp: string;
    dataPoints: number;
  };
  errorMessage?: string;
}

export class CRMAnalyticsAgent {
  private prisma: PrismaClient;
  private redis: RedisService;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
  }

  /**
   * Analisa dados de CRM usando IA
   */
  async analyzeCRM(request: CRMAnalyticsRequest): Promise<CRMAnalyticsResponse> {
    const startTime = Date.now();
    const analysisId = `crm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      logger.info(`🧠 Starting CRM analysis: ${request.analysisType} for tenant ${request.tenantId}`);

      // Verificar cache primeiro
      const cacheKey = this.generateCacheKey(request);
      const cached = await this.redis.get(cacheKey, {
        namespace: 'ai-crm',
        ttl: parseInt(process.env.REDIS_TTL_AI_ANALYSIS || '1800')
      });

      if (cached) {
        logger.info(`⚡ Cache HIT - CRM analysis: ${request.analysisType}`);
        return {
          ...cached,
          analysisId,
          metadata: {
            ...cached.metadata,
            processingTime: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }

      // Executar análise baseada no tipo
      let results: any;
      let confidence = 0.8; // Confiança padrão
      let dataPoints = 0;

      switch (request.analysisType) {
        case 'sales_forecast':
          results = await this.generateSalesForecast(request);
          confidence = 0.75;
          dataPoints = await this.getDealsCount(request.tenantId);
          break;
        case 'pipeline_optimization':
          results = await this.optimizePipeline(request);
          confidence = 0.85;
          dataPoints = await this.getPipelineDealsCount(request.inputData.pipelineId!);
          break;
        case 'churn_prediction':
          results = await this.predictChurn(request);
          confidence = 0.7;
          dataPoints = await this.getClientsCount(request.tenantId);
          break;
        case 'opportunity_scoring':
          results = await this.scoreOpportunities(request);
          confidence = 0.8;
          dataPoints = request.inputData.dealIds?.length || 0;
          break;
        case 'performance_analysis':
          results = await this.analyzePerformance(request);
          confidence = 0.9;
          dataPoints = await this.getUsersCount(request.tenantId);
          break;
        default:
          throw new Error(`Unknown analysis type: ${request.analysisType}`);
      }

      const response: CRMAnalyticsResponse = {
        analysisId,
        analysisType: request.analysisType,
        status: 'success',
        confidence,
        results,
        metadata: {
          processingTime: Date.now() - startTime,
          modelVersion: '1.0.0',
          timestamp: new Date().toISOString(),
          dataPoints
        }
      };

      // Cachear resultado
      await this.redis.set(cacheKey, response, {
        namespace: 'ai-crm',
        ttl: parseInt(process.env.REDIS_TTL_AI_ANALYSIS || '1800')
      });

      // Salvar no banco de dados
      await this.saveAnalysisToDatabase(analysisId, request, response);

      logger.info(`✅ CRM analysis completed: ${request.analysisType} (${analysisId})`);
      return response;

    } catch (error) {
      logger.error('Error in CRM analysis:', error);
      
      return {
        analysisId,
        analysisType: request.analysisType,
        status: 'failed',
        confidence: 0,
        results: {},
        metadata: {
          processingTime: Date.now() - startTime,
          modelVersion: '1.0.0',
          timestamp: new Date().toISOString(),
          dataPoints: 0
        },
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gera previsão de vendas
   */
  private async generateSalesForecast(request: CRMAnalyticsRequest) {
    const { tenantId, inputData } = request;
    
    // Buscar dados históricos de vendas
    const historicalData = await this.getHistoricalSalesData(tenantId, inputData.timeRange);
    
    // Calcular tendências
    const trends = this.calculateSalesTrends(historicalData);
    
    // Gerar previsão
    const forecastPeriod = inputData.forecastPeriod || 30;
    const predictedRevenue = this.calculatePredictedRevenue(historicalData, forecastPeriod);
    const predictedDeals = this.calculatePredictedDeals(historicalData, forecastPeriod);
    
    // Calcular intervalo de confiança
    const confidenceInterval = this.calculateConfidenceInterval(historicalData, predictedRevenue);
    
    return {
      salesForecast: {
        predictedRevenue: Math.round(predictedRevenue),
        predictedDeals: Math.round(predictedDeals),
        confidenceInterval: {
          lower: Math.round(confidenceInterval.lower),
          upper: Math.round(confidenceInterval.upper)
        },
        trends: trends,
        recommendations: this.generateSalesForecastRecommendations(trends, predictedRevenue),
        riskFactors: this.identifySalesRiskFactors(historicalData)
      }
    };
  }

  /**
   * Otimiza pipeline de vendas
   */
  private async optimizePipeline(request: CRMAnalyticsRequest) {
    const { pipelineId } = request.inputData;
    
    if (!pipelineId) {
      throw new Error('Pipeline ID is required for optimization');
    }

    // Buscar dados do pipeline
    const pipeline = await this.prisma.cRMPipeline.findUnique({
      where: { id: pipelineId }
    });

    if (!pipeline) {
      throw new Error('Pipeline not found');
    }

    // Buscar deals do pipeline separadamente
    const deals = await this.prisma.deal.findMany({
      where: { pipelineId },
      // Removido include de deals - pipeline não tem relação direta
    });

    // Analisar métricas atuais
    const currentMetrics = this.calculateCurrentPipelineMetrics(deals);
    
    // Identificar gargalos (pipeline.stages precisa ser cast para array)
    const stagesArray = Array.isArray(pipeline.stages) ? pipeline.stages : [];
    const bottlenecks = this.identifyPipelineBottlenecks(deals, stagesArray);
    
    // Calcular métricas otimizadas
    const optimizedMetrics = this.calculateOptimizedMetrics(currentMetrics, bottlenecks);
    
    // Gerar recomendações
    const recommendations = this.generatePipelineOptimizationRecommendations(bottlenecks);
    const priorityActions = this.generatePriorityActions(bottlenecks);

    return {
      pipelineOptimization: {
        currentMetrics,
        optimizedMetrics,
        bottlenecks,
        recommendations,
        priorityActions
      }
    };
  }

  /**
   * Prediz risco de churn de clientes
   */
  private async predictChurn(request: CRMAnalyticsRequest) {
    const { tenantId, inputData } = request;
    
    // Buscar clientes para análise
    const clients = await this.getClientsForChurnAnalysis(tenantId, inputData.clientIds);
    
    // Analisar cada cliente
    const churnAnalysis = await Promise.all(
      clients.map(client => this.analyzeClientChurnRisk(client))
    );

    // Categorizar clientes por risco
    const highRiskClients = churnAnalysis.filter(c => c.churnProbability > 0.7);
    const mediumRiskClients = churnAnalysis.filter(c => c.churnProbability > 0.4 && c.churnProbability <= 0.7);
    const lowRiskClients = churnAnalysis.filter(c => c.churnProbability <= 0.4);

    // Calcular risco geral
    const overallChurnRisk = this.calculateOverallChurnRisk(churnAnalysis);

    return {
      churnPrediction: {
        highRiskClients,
        mediumRiskClients,
        lowRiskClients,
        overallChurnRisk,
        recommendations: this.generateChurnPreventionRecommendations(churnAnalysis)
      }
    };
  }

  /**
   * Pontua oportunidades de vendas
   */
  private async scoreOpportunities(request: CRMAnalyticsRequest) {
    const { inputData } = request;
    
    if (!inputData.dealIds || inputData.dealIds.length === 0) {
      throw new Error('Deal IDs are required for opportunity scoring');
    }

    // Buscar deals
    const deals = await this.prisma.deal.findMany({
      where: { id: { in: inputData.dealIds } }
    });

    // Pontuar cada deal
    const scoredDeals = await Promise.all(
      deals.map(deal => this.scoreDeal(deal))
    );

    // Definir fatores de pontuação
    const scoringFactors = [
      { factor: 'deal_value', weight: 0.3, description: 'Valor do negócio' },
      { factor: 'client_engagement', weight: 0.25, description: 'Engajamento do cliente' },
      { factor: 'deal_stage', weight: 0.2, description: 'Estágio do pipeline' },
      { factor: 'time_in_pipeline', weight: 0.15, description: 'Tempo no pipeline' },
      { factor: 'client_history', weight: 0.1, description: 'Histórico do cliente' }
    ];

    return {
      opportunityScoring: {
        scoredDeals,
        scoringFactors,
        recommendations: this.generateOpportunityScoringRecommendations(scoredDeals)
      }
    };
  }

  /**
   * Analisa performance da equipe
   */
  private async analyzePerformance(request: CRMAnalyticsRequest) {
    const { tenantId, inputData } = request;
    
    // Buscar usuários para análise
    const users = await this.getUsersForPerformanceAnalysis(tenantId, inputData.userIds);
    
    // Analisar performance de cada usuário
    const userPerformance = await Promise.all(
      users.map(user => this.analyzeUserPerformance(user))
    );

    // Calcular métricas da equipe
    const teamMetrics = this.calculateTeamMetrics(userPerformance);

    return {
      performanceAnalysis: {
        userPerformance,
        teamMetrics,
        recommendations: this.generatePerformanceRecommendations(userPerformance)
      }
    };
  }

  /**
   * Busca dados históricos de vendas
   */
  private async getHistoricalSalesData(tenantId: string, timeRange?: any) {
    const whereClause: any = { tenantId };
    
    if (timeRange) {
      whereClause.createdAt = {
        gte: new Date(timeRange.startDate),
        lte: new Date(timeRange.endDate)
      };
    }

    const deals = await this.prisma.deal.findMany({
      where: whereClause,
      select: {
        id: true,
        value: true,
        stage: true,
        createdAt: true,
        actualCloseDate: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return deals;
  }

  /**
   * Calcula tendências de vendas
   */
  private calculateSalesTrends(historicalData: any[]) {
    // Implementação simplificada - em produção seria mais complexa
    const monthlyData = this.groupDataByMonth(historicalData);
    
    return monthlyData.map((data, index) => ({
      period: data.month,
      revenue: data.revenue,
      deals: data.deals
    }));
  }

  /**
   * Calcula receita prevista
   */
  private calculatePredictedRevenue(historicalData: any[], forecastPeriod: number): number {
    const recentData = historicalData.slice(-30); // Últimos 30 dias
    const averageDailyRevenue = recentData.reduce((sum, deal) => sum + (deal.value || 0), 0) / 30;
    
    return averageDailyRevenue * forecastPeriod;
  }

  /**
   * Calcula negócios previstos
   */
  private calculatePredictedDeals(historicalData: any[], forecastPeriod: number): number {
    const recentData = historicalData.slice(-30); // Últimos 30 dias
    const averageDailyDeals = recentData.length / 30;
    
    return averageDailyDeals * forecastPeriod;
  }

  /**
   * Calcula intervalo de confiança
   */
  private calculateConfidenceInterval(historicalData: any[], predictedRevenue: number) {
    // Implementação simplificada
    const variance = predictedRevenue * 0.2; // 20% de variação
    
    return {
      lower: predictedRevenue - variance,
      upper: predictedRevenue + variance
    };
  }

  /**
   * Calcula métricas atuais do pipeline
   */
  private calculateCurrentPipelineMetrics(deals: any[]) {
    const totalDeals = deals.length;
    const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
    const wonDeals = deals.filter(deal => deal.status === 'won');
    const conversionRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
    
    return {
      totalDeals,
      totalValue,
      averageDealSize: totalDeals > 0 ? totalValue / totalDeals : 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageDealDuration: this.calculateAverageDealDuration(deals)
    };
  }

  /**
   * Identifica gargalos no pipeline
   */
  private identifyPipelineBottlenecks(deals: any[], stages: any[]) {
    const bottlenecks = [];
    
    // Analisar cada estágio
    for (const stage of stages) {
      const stageDeals = deals.filter(deal => deal.stage === stage.name);
      const stageDuration = this.calculateStageDuration(stageDeals);
      
      if (stageDuration > 30) { // Mais de 30 dias no estágio
        bottlenecks.push({
          stage: stage.name,
          issue: 'Deals ficam muito tempo neste estágio',
          impact: 'high' as const,
          recommendation: 'Revisar processo e identificar bloqueios'
        } as any);
      }
    }
    
    return bottlenecks;
  }

  /**
   * Calcula métricas otimizadas
   */
  private calculateOptimizedMetrics(currentMetrics: any, bottlenecks: any[]) {
    const improvementFactor = bottlenecks.length > 0 ? 0.8 : 1.2; // Reduzir se há gargalos
    
    return {
      projectedDeals: Math.round(currentMetrics.totalDeals * improvementFactor),
      projectedValue: Math.round(currentMetrics.totalValue * improvementFactor),
      projectedConversionRate: Math.round(currentMetrics.conversionRate * improvementFactor * 100) / 100,
      projectedDuration: Math.round(currentMetrics.averageDealDuration * improvementFactor)
    };
  }

  /**
   * Busca clientes para análise de churn
   */
  private async getClientsForChurnAnalysis(tenantId: string, clientIds?: string[]) {
    const whereClause: any = { tenantId };
    
    if (clientIds && clientIds.length > 0) {
      whereClause.id = { in: clientIds };
    }

    const clients = await this.prisma.nutritionClient.findMany({
      where: whereClause
      // Removido includes - user não existe em NutritionClient, consultations também não existe
    });

    return clients;
  }

  /**
   * Analisa risco de churn de um cliente
   */
  private async analyzeClientChurnRisk(client: any) {
    const riskFactors: string[] = [];
    let churnProbability = 0.1; // Base

    // Fator: Última atividade
    const lastActivity = this.getLastActivityDate(client);
    const daysSinceActivity = this.getDaysSince(lastActivity);
    
    if (daysSinceActivity > 30) {
      riskFactors.push('Sem atividade recente');
      churnProbability += 0.3;
    }

    // Fator: Número de consultas (removido - consultations não existe no include)
    // TODO: Buscar consultations quando modelo estiver disponível
    // if (client.consultations?.length < 2) {
    //   riskFactors.push('Poucas consultas realizadas');
    //   churnProbability += 0.2;
    // }

    // Fator: Deals perdidos (removido - deals não está mais no include)
    // const lostDeals = client.deals.filter((deal: any) => deal.status === 'lost');
    // if (lostDeals.length > 0) {
    //   riskFactors.push('Histórico de negócios perdidos');
    //   churnProbability += 0.2;
    // }

    // Fator: Tempo como cliente
    const clientAge = this.getDaysSince(client.createdAt);
    if (clientAge < 30) {
      riskFactors.push('Cliente novo');
      churnProbability += 0.1;
    }

    return {
      clientId: client.id,
      clientName: 'Client ' + client.id, // TODO: Buscar nome quando modelo estiver disponível
      churnProbability: Math.min(churnProbability, 1.0),
      riskFactors,
      lastActivity: lastActivity.toISOString(),
      recommendedActions: this.generateChurnPreventionActions(riskFactors)
    };
  }

  /**
   * Pontua um deal específico
   */
  private async scoreDeal(deal: any) {
    let score = 0;
    const factors: any[] = [];

    // Fator: Valor do deal (0-30 pontos)
    const valueScore = Math.min((deal.value || 0) / 10000 * 30, 30);
    score += valueScore;
    factors.push({
      factor: 'deal_value',
      weight: 0.3,
      value: valueScore,
      impact: 'positive' as const
    });

    // Fator: Engajamento do cliente (0-25 pontos)
    const engagementScore = this.calculateClientEngagement(deal.client);
    score += engagementScore;
    factors.push({
      factor: 'client_engagement',
      weight: 0.25,
      value: engagementScore,
      impact: 'positive' as const
    });

    // Fator: Estágio do pipeline (0-20 pontos)
    const stageScore = this.calculateStageScore(deal.stage);
    score += stageScore;
    factors.push({
      factor: 'deal_stage',
      weight: 0.2,
      value: stageScore,
      impact: 'positive' as const
    });

    // Fator: Tempo no pipeline (0-15 pontos)
    const timeScore = this.calculateTimeScore(deal.createdAt);
    score += timeScore;
    factors.push({
      factor: 'time_in_pipeline',
      weight: 0.15,
      value: timeScore,
      impact: timeScore > 10 ? 'positive' : 'negative' as const
    });

    // Fator: Histórico do cliente (0-10 pontos)
    const historyScore = this.calculateClientHistoryScore(deal.client);
    score += historyScore;
    factors.push({
      factor: 'client_history',
      weight: 0.1,
      value: historyScore,
      impact: 'positive' as const
    });

    return {
      dealId: deal.id,
      dealTitle: deal.title,
      score: Math.round(score),
      factors,
      recommendation: this.generateDealRecommendation(score),
      priority: this.getDealPriority(score)
    };
  }

  /**
   * Métodos auxiliares
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private getDaysSince(date: Date): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getLastActivityDate(client: any): Date {
    // TODO: Buscar consultations quando modelo estiver disponível
    const activities: Date[] = [];
    // ...(client.consultations || []).map((consultation: any) => consultation.scheduledAt)
    
    if (activities.length === 0) {
      return new Date(); // Retornar hoje se não houver atividades
    }
    
    return new Date(Math.max(...activities.map((date: Date) => date.getTime())));
  }

  private calculateAverageDealDuration(deals: any[]): number {
    const closedDeals = deals.filter(deal => deal.closedAt);
    if (closedDeals.length === 0) return 0;
    
    const totalDuration = closedDeals.reduce((sum, deal) => {
      const duration = deal.closedAt.getTime() - deal.createdAt.getTime();
      return sum + duration;
    }, 0);
    
    return totalDuration / closedDeals.length / (1000 * 60 * 60 * 24); // em dias
  }

  private calculateStageDuration(stageDeals: any[]): number {
    if (stageDeals.length === 0) return 0;
    
    const totalDuration = stageDeals.reduce((sum, deal) => {
      const duration = deal.updatedAt.getTime() - deal.createdAt.getTime();
      return sum + duration;
    }, 0);
    
    return totalDuration / stageDeals.length / (1000 * 60 * 60 * 24); // em dias
  }

  private calculateClientEngagement(client: any): number {
    // TODO: Buscar consultations quando modelo estiver disponível
    // const consultations = client.consultations?.length || 0;
    const consultations = 0; // Placeholder
    
    return Math.min(consultations * 5, 25);
  }

  private calculateStageScore(stage: string): number {
    const stageScores: Record<string, number> = {
      'lead': 5,
      'qualification': 10,
      'proposal': 15,
      'negotiation': 18,
      'closing': 20
    };
    
    return stageScores[stage] || 0;
  }

  private calculateTimeScore(createdAt: Date): number {
    const daysSinceCreation = this.getDaysSince(createdAt);
    
    if (daysSinceCreation < 7) return 15;
    if (daysSinceCreation < 30) return 10;
    if (daysSinceCreation < 90) return 5;
    return 0;
  }

  private calculateClientHistoryScore(client: any): number {
    // TODO: Implementar quando relação deals estiver disponível
    return 0;
  }

  private getDealPriority(score: number): 'low' | 'medium' | 'high' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private generateDealRecommendation(score: number): string {
    if (score >= 70) return 'Prioridade alta - Foque neste deal';
    if (score >= 40) return 'Prioridade média - Monitore de perto';
    return 'Prioridade baixa - Considere qualificar melhor';
  }

  private generateChurnPreventionActions(riskFactors: string[]): string[] {
    const actions: string[] = [];
    
    if (riskFactors.includes('Sem atividade recente')) {
      actions.push('Entrar em contato imediatamente');
    }
    
    if (riskFactors.includes('Poucas consultas realizadas')) {
      actions.push('Agendar consulta de follow-up');
    }
    
    if (riskFactors.includes('Histórico de negócios perdidos')) {
      actions.push('Revisar estratégia de abordagem');
    }
    
    return actions;
  }

  private generateCacheKey(request: CRMAnalyticsRequest): string {
    const keyData = {
      type: request.analysisType,
      tenantId: request.tenantId,
      inputHash: JSON.stringify(request.inputData),
      filtersHash: JSON.stringify(request.filters)
    };
    
    return `crm-analysis:${JSON.stringify(keyData)}`;
  }

  private async saveAnalysisToDatabase(analysisId: string, request: CRMAnalyticsRequest, response: CRMAnalyticsResponse) {
    try {
      // AIGenerationLog requer campos obrigatórios: type e prompt
      // Como não temos esses campos na análise CRM, pulamos o log
      // await this.prisma.aIGenerationLog.create({...});
    } catch (error) {
      logger.error('Error saving CRM analysis to database:', error);
    }
  }

  // Métodos auxiliares para contagem
  private async getDealsCount(tenantId: string): Promise<number> {
    return await this.prisma.deal.count({ where: { tenantId } });
  }

  private async getPipelineDealsCount(pipelineId: string): Promise<number> {
    return await this.prisma.deal.count({ where: { pipelineId } });
  }

  private async getClientsCount(tenantId: string): Promise<number> {
    return await this.prisma.nutritionClient.count({ where: { tenantId } });
  }

  private async getUsersCount(tenantId: string): Promise<number> {
    return await this.prisma.user.count({ where: { tenantId } });
  }

  private async getUsersForPerformanceAnalysis(tenantId: string, userIds?: string[]) {
    const whereClause: any = { tenantId };
    
    if (userIds && userIds.length > 0) {
      whereClause.id = { in: userIds };
    }

    return await this.prisma.user.findMany({
      where: whereClause
    });
  }

  private async analyzeUserPerformance(user: any) {
    // Buscar deals separadamente
    const deals = await this.prisma.deal.findMany({
      where: { assignedUserId: user.id }
    });
    const dealsCreated = deals.length;
    const dealsClosed = deals.filter((deal: any) => deal.status === 'won').length;
    const revenueGenerated = deals.filter((deal: any) => deal.status === 'won').reduce((sum: number, deal: any) => sum + (deal.value || 0), 0);
    const conversionRate = dealsCreated > 0 ? (dealsClosed / dealsCreated) * 100 : 0;
    const averageDealSize = dealsClosed > 0 ? revenueGenerated / dealsClosed : 0;
    const averageDealDuration = this.calculateAverageDealDuration(deals);

    const score = this.calculateUserPerformanceScore({
      dealsCreated,
      dealsClosed,
      revenueGenerated,
      conversionRate,
      averageDealSize,
      averageDealDuration
    });

    return {
      userId: user.id,
      userName: user.name,
      metrics: {
        dealsCreated,
        dealsClosed,
        revenueGenerated: Math.round(revenueGenerated),
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageDealSize: Math.round(averageDealSize),
        averageDealDuration: Math.round(averageDealDuration)
      },
      score,
      strengths: this.identifyUserStrengths({ dealsCreated, dealsClosed, conversionRate }),
      improvementAreas: this.identifyImprovementAreas({ dealsCreated, dealsClosed, conversionRate }),
      recommendations: this.generateUserRecommendations({ dealsCreated, dealsClosed, conversionRate })
    };
  }

  private calculateUserPerformanceScore(metrics: any): number {
    let score = 0;
    
    // Pontuação baseada em conversão
    score += Math.min(metrics.conversionRate * 2, 40);
    
    // Pontuação baseada em volume
    score += Math.min(metrics.dealsCreated * 2, 30);
    
    // Pontuação baseada em receita
    score += Math.min(metrics.revenueGenerated / 1000, 30);
    
    return Math.round(score);
  }

  private identifyUserStrengths(metrics: any): string[] {
    const strengths: string[] = [];
    
    if (metrics.conversionRate > 30) {
      strengths.push('Alta taxa de conversão');
    }
    
    if (metrics.dealsCreated > 10) {
      strengths.push('Alto volume de negócios');
    }
    
    return strengths;
  }

  private identifyImprovementAreas(metrics: any): string[] {
    const areas: string[] = [];
    
    if (metrics.conversionRate < 20) {
      areas.push('Melhorar taxa de conversão');
    }
    
    if (metrics.dealsCreated < 5) {
      areas.push('Aumentar volume de negócios');
    }
    
    return areas;
  }

  private generateUserRecommendations(metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (metrics.conversionRate < 20) {
      recommendations.push('Focar na qualificação de leads');
      recommendations.push('Melhorar técnicas de fechamento');
    }
    
    if (metrics.dealsCreated < 5) {
      recommendations.push('Aumentar atividade de prospecção');
      recommendations.push('Melhorar pipeline de leads');
    }
    
    return recommendations;
  }

  private calculateTeamMetrics(userPerformance: any[]) {
    const totalDeals = userPerformance.reduce((sum, user) => sum + user.metrics.dealsCreated, 0);
    const totalRevenue = userPerformance.reduce((sum, user) => sum + user.metrics.revenueGenerated, 0);
    const averageConversionRate = userPerformance.reduce((sum, user) => sum + user.metrics.conversionRate, 0) / userPerformance.length;
    
    const sortedByScore = userPerformance.sort((a, b) => b.score - a.score);
    const topPerformers = sortedByScore.slice(0, 3).map(user => user.userName);
    const underPerformers = sortedByScore.slice(-2).map(user => user.userName);

    return {
      totalDeals,
      totalRevenue,
      averageConversionRate: Math.round(averageConversionRate * 100) / 100,
      topPerformers,
      underPerformers
    };
  }

  private groupDataByMonth(historicalData: any[]) {
    // Implementação simplificada
    const monthlyData: Record<string, { revenue: number; deals: number }> = {};
    
    historicalData.forEach(deal => {
      const month = deal.createdAt.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, deals: 0 };
      }
      
      monthlyData[month].revenue += deal.value || 0;
      monthlyData[month].deals += 1;
    });
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      deals: data.deals
    }));
  }

  private calculateOverallChurnRisk(churnAnalysis: any[]): 'low' | 'medium' | 'high' {
    const highRiskCount = churnAnalysis.filter(c => c.churnProbability > 0.7).length;
    const totalClients = churnAnalysis.length;
    
    const highRiskPercentage = (highRiskCount / totalClients) * 100;
    
    if (highRiskPercentage > 30) return 'high';
    if (highRiskPercentage > 15) return 'medium';
    return 'low';
  }

  // Métodos de geração de recomendações
  private generateSalesForecastRecommendations(trends: any[], predictedRevenue: number): string[] {
    return [
      'Monitore tendências mensais de perto',
      'Ajuste estratégias baseado em sazonalidade',
      'Prepare equipe para volume previsto'
    ];
  }

  private identifySalesRiskFactors(historicalData: any[]): string[] {
    return [
      'Dependência de poucos clientes grandes',
      'Sazonalidade nos negócios',
      'Concorrência crescente'
    ];
  }

  private generatePipelineOptimizationRecommendations(bottlenecks: any[]): string[] {
    return [
      'Identifique e resolva gargalos rapidamente',
      'Implemente automações para estágios críticos',
      'Treine equipe em técnicas de avanço'
    ];
  }

  private generatePriorityActions(bottlenecks: any[]): any[] {
    return bottlenecks.map(bottleneck => ({
      action: bottleneck.recommendation,
      impact: bottleneck.impact,
      effort: 'medium' as const,
      timeline: '2-4 semanas'
    }));
  }

  private generateChurnPreventionRecommendations(churnAnalysis: any[]): string[] {
    return [
      'Implemente programa de retenção',
      'Monitore indicadores de churn semanalmente',
      'Crie campanhas de reativação'
    ];
  }

  private generateOpportunityScoringRecommendations(scoredDeals: any[]): string[] {
    return [
      'Foque nos deals de alta pontuação',
      'Qualifique melhor os deals de baixa pontuação',
      'Use pontuação para priorizar atividades'
    ];
  }

  private generatePerformanceRecommendations(userPerformance: any[]): string[] {
    return [
      'Implemente coaching individualizado',
      'Compartilhe melhores práticas entre equipe',
      'Estabeleça metas baseadas em performance'
    ];
  }

  /**
   * Health check do agente
   */
  async healthCheck() {
    try {
      // Testar conexão com banco
      await this.prisma.deal.count();
      
      // Testar Redis
      const redisHealth = await this.redis.healthCheck();
      
      return {
        status: 'healthy',
        database: 'connected',
        redis: redisHealth.status,
        redisLatency: redisHealth.latency,
        agentVersion: '1.0.0'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instância singleton
export const crmAnalyticsAgent = new CRMAnalyticsAgent();
