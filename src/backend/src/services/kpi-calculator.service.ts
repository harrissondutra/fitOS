import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { cache } from '../config/redis';

interface ExecutiveKPIs {
  // Métricas de eficiência
  costPerUser: number;           // Custo total / usuários ativos
  costPerRequest: number;        // Custo total / número de requests
  costPerFeature: {              // Custo atribuído por feature
    featureName: string;
    cost: number;
    percentage: number;
  }[];
  
  // Métricas financeiras
  burnRate: number;              // Quanto gasta por dia (R$/dia)
  runway: number;                // Quantos meses o orçamento dura
  monthlyRecurringCost: number;  // Custos recorrentes mensais
  variableCostRatio: number;     // % de custos variáveis
  
  // Métricas de eficiência
  costEfficiencyScore: number;   // Score 0-100
  wastePercentage: number;        // % de recursos desperdiçados
  optimizationPotential: number; // Economia potencial (R$)
  
  // Comparações
  vsLastMonth: {
    costChange: number;
    efficiencyChange: number;
  };
  vsTarget: {
    costDiff: number;
    status: 'on_track' | 'over_budget' | 'under_budget';
  };
}

interface KPICalculationParams {
  startDate: Date;
  endDate: Date;
  tenantId?: string;
  includeProjections?: boolean;
}

export class KPICalculatorService {
  private readonly CACHE_KEY_PREFIX: string;
  private readonly CACHE_TTL: number;
  private _prisma: ReturnType<typeof getPrismaClient> | null = null;

  constructor() {
    // Usar variáveis de ambiente (ZERO hardcode)
    const redisPrefix = process.env.REDIS_KEY_PREFIX || 'fitos:';
    this.CACHE_KEY_PREFIX = `${redisPrefix}kpis:executive:`;
    this.CACHE_TTL = parseInt(process.env.COST_CACHE_TTL_DASHBOARD || process.env.COST_CACHE_TTL || '300');
  }

  // Lazy getter para PrismaClient
  private get prisma() {
    if (!this._prisma) {
      this._prisma = getPrismaClient();
    }
    return this._prisma;
  }

  /**
   * Calcula todos os KPIs executivos
   */
  async calculateExecutiveKPIs(params: KPICalculationParams): Promise<ExecutiveKPIs> {
    try {
      // 1. Gerar chave de cache
      const cacheKey = `${this.CACHE_KEY_PREFIX}${params.startDate.toISOString()}:${params.endDate.toISOString()}:${params.tenantId || 'all'}`;

      // 2. Tentar cache Redis primeiro
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        const cached = await cache.get(cacheKey);
        if (cached) {
          logger.info('Executive KPIs retrieved from cache');
          return JSON.parse(cached);
        }
      }

      // 3. Calcular KPIs em paralelo
      const [
        totalCosts,
        totalUsers,
        totalRequests,
        monthlyBudget,
        lastMonthData,
        featureCosts,
        recurringCosts,
        variableCosts,
      ] = await Promise.all([
        this.getTotalCosts(params),
        this.getTotalActiveUsers(params),
        this.getTotalRequests(params),
        this.getMonthlyBudget(params),
        this.getLastMonthData(params),
        this.getFeatureCosts(params),
        this.getRecurringCosts(params),
        this.getVariableCosts(params),
      ]);

      // 4. Calcular métricas derivadas
      const kpis: ExecutiveKPIs = {
        // Métricas de eficiência
        costPerUser: totalUsers > 0 ? totalCosts / totalUsers : 0,
        costPerRequest: totalRequests > 0 ? totalCosts / totalRequests : 0,
        costPerFeature: featureCosts,

        // Métricas financeiras
        burnRate: this.calculateBurnRate(totalCosts, params),
        runway: this.calculateRunway(totalCosts, monthlyBudget),
        monthlyRecurringCost: recurringCosts,
        variableCostRatio: totalCosts > 0 ? (variableCosts / totalCosts) * 100 : 0,

        // Métricas de eficiência
        costEfficiencyScore: this.calculateEfficiencyScore(totalCosts, totalUsers, totalRequests),
        wastePercentage: this.calculateWastePercentage(totalCosts, featureCosts),
        optimizationPotential: this.calculateOptimizationPotential(totalCosts, featureCosts),

        // Comparações
        vsLastMonth: {
          costChange: this.calculateCostChange(totalCosts, lastMonthData.totalCost),
          efficiencyChange: this.calculateEfficiencyChange(totalCosts, totalUsers, lastMonthData),
        },
        vsTarget: {
          costDiff: totalCosts - monthlyBudget,
          status: this.getBudgetStatus(totalCosts, monthlyBudget),
        },
      };

      // 5. Armazenar no cache Redis
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        await cache.set(cacheKey, JSON.stringify(kpis), this.CACHE_TTL);
        logger.info(`Executive KPIs cached for ${this.CACHE_TTL} seconds`);
      }

      return kpis;
    } catch (error) {
      logger.error('Failed to calculate executive KPIs:', error);
      throw error;
    }
  }

  /**
   * Obtém custos totais do período
   */
  private async getTotalCosts(params: KPICalculationParams): Promise<number> {
    const where: any = {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    const result = await this.prisma.costEntry.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Obtém total de usuários ativos
   */
  private async getTotalActiveUsers(params: KPICalculationParams): Promise<number> {
    // Buscar usuários que fizeram login no período
    const where: any = {
      lastLogin: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    return await this.prisma.user.count({ where });
  }

  /**
   * Obtém total de requests
   */
  private async getTotalRequests(params: KPICalculationParams): Promise<number> {
    const where: any = {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    // Usar UsageTracking como proxy para requests
    return await this.prisma.usageTracking.count({ where });
  }

  /**
   * Obtém orçamento mensal
   */
  private async getMonthlyBudget(params: KPICalculationParams): Promise<number> {
    const budget = await this.prisma.costBudget.findFirst({
      where: {
        startDate: { lte: params.endDate },
        endDate: { gte: params.startDate },
        ...(params.tenantId && { tenantId: params.tenantId }),
      },
      orderBy: { createdAt: 'desc' },
    });

    return Number(budget?.monthlyLimit || 0);
  }

  /**
   * Obtém dados do mês anterior para comparação
   */
  private async getLastMonthData(params: KPICalculationParams): Promise<{
    totalCost: number;
    totalUsers: number;
    totalRequests: number;
  }> {
    const lastMonthStart = new Date(params.startDate);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const lastMonthEnd = new Date(params.endDate);
    lastMonthEnd.setMonth(lastMonthEnd.getMonth() - 1);

    const [totalCost, totalUsers, totalRequests] = await Promise.all([
      this.getTotalCosts({ ...params, startDate: lastMonthStart, endDate: lastMonthEnd }),
      this.getTotalActiveUsers({ ...params, startDate: lastMonthStart, endDate: lastMonthEnd }),
      this.getTotalRequests({ ...params, startDate: lastMonthStart, endDate: lastMonthEnd }),
    ]);

    return { totalCost, totalUsers, totalRequests };
  }

  /**
   * Obtém custos por feature
   */
  private async getFeatureCosts(params: KPICalculationParams): Promise<{
    featureName: string;
    cost: number;
    percentage: number;
  }[]> {
    const where: any = {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
    };

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    const costs = await this.prisma.costEntry.groupBy({
      by: ['categoryId'],
      where,
      _sum: {
        amount: true,
      },
    });

    const totalCost = costs.reduce((sum, cost) => sum + Number(cost._sum.amount || 0), 0);

    return costs.map(cost => ({
      featureName: cost.categoryId,
      cost: Number(cost._sum.amount || 0),
      percentage: totalCost > 0 ? (Number(cost._sum.amount || 0) / totalCost) * 100 : 0,
    }));
  }

  /**
   * Obtém custos recorrentes
   */
  private async getRecurringCosts(params: KPICalculationParams): Promise<number> {
    const where: any = {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      entryType: 'recurring', // Custos marcados como recorrentes
    };

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    const result = await this.prisma.costEntry.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Obtém custos variáveis
   */
  private async getVariableCosts(params: KPICalculationParams): Promise<number> {
    const where: any = {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      entryType: { not: 'recurring' }, // Custos não recorrentes
    };

    if (params.tenantId) {
      where.tenantId = params.tenantId;
    }

    const result = await this.prisma.costEntry.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    return Number(result._sum.amount || 0);
  }

  /**
   * Calcula burn rate (R$/dia)
   */
  private calculateBurnRate(totalCost: number, params: KPICalculationParams): number {
    const daysDiff = Math.ceil((params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 0 ? totalCost / daysDiff : 0;
  }

  /**
   * Calcula runway (meses restantes)
   */
  private calculateRunway(totalCost: number, monthlyBudget: number): number {
    if (monthlyBudget <= 0) return 0;
    return monthlyBudget / (totalCost / 30); // Assumindo custo mensal baseado no período
  }

  /**
   * Calcula score de eficiência (0-100)
   */
  private calculateEfficiencyScore(totalCost: number, totalUsers: number, totalRequests: number): number {
    if (totalUsers === 0 || totalRequests === 0) return 0;

    // Score baseado em custo por usuário e por request
    const costPerUser = totalCost / totalUsers;
    const costPerRequest = totalCost / totalRequests;

    // Benchmarks ideais (configuráveis via env)
    const idealCostPerUser = parseFloat(process.env.KPI_IDEAL_COST_PER_USER || '50');
    const idealCostPerRequest = parseFloat(process.env.KPI_IDEAL_COST_PER_REQUEST || '0.01');

    const userScore = Math.max(0, 100 - ((costPerUser / idealCostPerUser) * 100));
    const requestScore = Math.max(0, 100 - ((costPerRequest / idealCostPerRequest) * 100));

    return (userScore + requestScore) / 2;
  }

  /**
   * Calcula porcentagem de desperdício
   */
  private calculateWastePercentage(totalCost: number, featureCosts: {
    featureName: string;
    cost: number;
    percentage: number;
  }[]): number {
    // Identificar features com baixo ROI (configurável)
    const lowROIFeatures = featureCosts.filter(feature => 
      feature.percentage > parseFloat(process.env.KPI_LOW_ROI_THRESHOLD || '20') && 
      feature.cost > parseFloat(process.env.KPI_HIGH_COST_THRESHOLD || '1000')
    );

    const wasteCost = lowROIFeatures.reduce((sum, feature) => sum + feature.cost, 0);
    return totalCost > 0 ? (wasteCost / totalCost) * 100 : 0;
  }

  /**
   * Calcula potencial de otimização
   */
  private calculateOptimizationPotential(totalCost: number, featureCosts: {
    featureName: string;
    cost: number;
    percentage: number;
  }[]): number {
    const wastePercentage = this.calculateWastePercentage(totalCost, featureCosts);
    const optimizationRate = parseFloat(process.env.KPI_OPTIMIZATION_RATE || '0.3'); // 30% de economia possível
    
    return totalCost * (wastePercentage / 100) * optimizationRate;
  }

  /**
   * Calcula mudança de custo vs mês anterior
   */
  private calculateCostChange(currentCost: number, lastMonthCost: number): number {
    if (lastMonthCost === 0) return 0;
    return ((currentCost - lastMonthCost) / lastMonthCost) * 100;
  }

  /**
   * Calcula mudança de eficiência vs mês anterior
   */
  private calculateEfficiencyChange(currentCost: number, currentUsers: number, lastMonthData: {
    totalCost: number;
    totalUsers: number;
    totalRequests: number;
  }): number {
    const currentEfficiency = this.calculateEfficiencyScore(currentCost, currentUsers, 0);
    const lastMonthEfficiency = this.calculateEfficiencyScore(lastMonthData.totalCost, lastMonthData.totalUsers, 0);
    
    return currentEfficiency - lastMonthEfficiency;
  }

  /**
   * Determina status do orçamento
   */
  private getBudgetStatus(totalCost: number, monthlyBudget: number): 'on_track' | 'over_budget' | 'under_budget' {
    if (monthlyBudget === 0) return 'on_track';
    
    const percentage = (totalCost / monthlyBudget) * 100;
    
    if (percentage > 100) return 'over_budget';
    if (percentage < 80) return 'under_budget';
    return 'on_track';
  }

  /**
   * Obtém KPIs em tempo real (sem cache)
   */
  async getRealTimeKPIs(params: KPICalculationParams): Promise<ExecutiveKPIs> {
    // Limpar cache para forçar recálculo
    const cacheKey = `${this.CACHE_KEY_PREFIX}${params.startDate.toISOString()}:${params.endDate.toISOString()}:${params.tenantId || 'all'}`;
    
    if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
      await cache.del(cacheKey);
    }

    return this.calculateExecutiveKPIs(params);
  }

  /**
   * Obtém histórico de KPIs
   */
  async getKPIsHistory(
    months: number = 12,
    tenantId?: string
  ): Promise<Array<{
    month: string;
    kpis: ExecutiveKPIs;
  }>> {
    const history: Array<{
      month: string;
      kpis: ExecutiveKPIs;
    }> = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const kpis = await this.calculateExecutiveKPIs({
        startDate: monthStart,
        endDate: monthEnd,
        tenantId,
      });

      history.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM
        kpis,
      });
    }

    return history.reverse(); // Mais recente primeiro
  }
}

// Exportar instância singleton
export const kpiCalculatorService = new KPICalculatorService();
