import { PrismaClient } from '@prisma/client';
import { config } from '../config/config-simple';
import { logger } from '../utils/logger';
import { cache } from '../config/redis';

const prisma = new PrismaClient();

// Interfaces para tipagem
export interface CostDashboard {
  totalCost: number;
  totalCostPreviousMonth: number;
  costVariation: number;
  projectedCost: number;
  categories: CategorySummary[];
  topServices: ServiceSummary[];
  alerts: AlertSummary[];
  trends: TrendData[];
  fixedVsVariable: {
    fixed: number;
    variable: number;
    fixedPercentage: number;
    variablePercentage: number;
  };
}

export interface CategorySummary {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  totalCost: number;
  percentage: number;
  previousMonthCost: number;
  variation: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ServiceSummary {
  id: string;
  name: string;
  displayName: string;
  categoryName: string;
  totalCost: number;
  percentage: number;
  requestCount: number;
  averageCost: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AlertSummary {
  id: string;
  type: string;
  severity: string;
  message: string;
  currentAmount: number;
  limitAmount?: number;
  percentage?: number;
  createdAt: Date;
}

export interface TrendData {
  date: string;
  totalCost: number;
  categories: Record<string, number>;
}

export interface CostFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  serviceId?: string;
  tags?: string[];
  tenantId?: string;
  clientId?: string;
}

export interface CostEntryInput {
  categoryId: string;
  serviceId: string;
  amount: number;
  currency?: string;
  date?: Date;
  description?: string;
  tags?: string[];
  metadata?: any;
  revenueGenerated?: number;
  tenantId?: string;
  clientId?: string;
  createdBy?: string;
}

export interface BudgetInput {
  categoryId?: string;
  monthlyLimit: number;
  currency?: string;
  alertAt75?: boolean;
  alertAt90?: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface SmartComparison {
  currentVsAverage: {
    current: number;
    average: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  anomalies: Array<{
    service: string;
    current: number;
    average: number;
    deviation: number;
  }>;
  trends: Array<{
    category: string;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export class CostManagementService {
  /**
   * Obter dashboard completo de custos
   */
  async getDashboard(filters: CostFilters = {}): Promise<CostDashboard> {
    const cacheKey = `costs:dashboard:${JSON.stringify(filters)}`;
    
    // Tentar buscar do cache primeiro
    if (config.costs.redisCacheEnabled) {
      try {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn('Failed to get dashboard from cache:', error);
      }
    }

    const { startDate, endDate, categoryId, serviceId, tags, tenantId, clientId } = filters;
    
    // Calcular datas padrão se não fornecidas
    const now = new Date();
    const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Mês anterior para comparação
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Construir filtros do Prisma
    const whereClause: any = {
      date: {
        gte: start,
        lte: end,
      },
    };

    if (categoryId) whereClause.categoryId = categoryId;
    if (serviceId) whereClause.serviceId = serviceId;
    if (tenantId) whereClause.tenantId = tenantId;
    if (clientId) whereClause.clientId = clientId;
    if (tags && tags.length > 0) {
      whereClause.tags = {
        hasSome: tags,
      };
    }

    // Buscar dados em paralelo
    const [
      currentMonthData,
      previousMonthData,
      categories,
      services,
      alerts,
      trendsData,
    ] = await Promise.all([
      // Dados do mês atual
      prisma.costEntry.findMany({
        where: whereClause,
        include: {
          category: true,
          service: true,
        },
      }),
      
      // Dados do mês anterior
      prisma.costEntry.findMany({
        where: {
          ...whereClause,
          date: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
        include: {
          category: true,
          service: true,
        },
      }),
      
      // Categorias
      prisma.costCategory.findMany({
        where: { isActive: true },
        include: {
          services: {
            where: { isActive: true },
          },
        },
      }),
      
      // Serviços
      prisma.costService.findMany({
        where: { isActive: true },
        include: {
          category: true,
        },
      }),
      
      // Alertas ativos
      prisma.costAlert.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      
      // Dados de tendência (últimos 6 meses)
      this.getTrendsData(6),
    ]);

    // Calcular totais
    const totalCost = currentMonthData.reduce((sum, entry) => sum + entry.amount, 0);
    const totalCostPreviousMonth = previousMonthData.reduce((sum, entry) => sum + entry.amount, 0);
    const costVariation = totalCostPreviousMonth > 0 
      ? ((totalCost - totalCostPreviousMonth) / totalCostPreviousMonth) * 100 
      : 0;

    // Projeção para fim do mês
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const projectedCost = daysPassed > 0 ? (totalCost / daysPassed) * daysInMonth : 0;

    // Resumo por categoria
    const categoryMap = new Map<string, CategorySummary>();
    categories.forEach(cat => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        displayName: cat.displayName,
        icon: cat.icon,
        color: cat.color,
        totalCost: 0,
        percentage: 0,
        previousMonthCost: 0,
        variation: 0,
        trend: 'stable',
      });
    });

    // Calcular custos por categoria (mês atual)
    currentMonthData.forEach(entry => {
      const category = categoryMap.get(entry.categoryId);
      if (category) {
        category.totalCost += entry.amount;
      }
    });

    // Calcular custos por categoria (mês anterior)
    previousMonthData.forEach(entry => {
      const category = categoryMap.get(entry.categoryId);
      if (category) {
        category.previousMonthCost += entry.amount;
      }
    });

    // Calcular percentuais e variações
    categoryMap.forEach(category => {
      category.percentage = totalCost > 0 ? (category.totalCost / totalCost) * 100 : 0;
      category.variation = category.previousMonthCost > 0 
        ? ((category.totalCost - category.previousMonthCost) / category.previousMonthCost) * 100 
        : 0;
      category.trend = category.variation > 5 ? 'up' : category.variation < -5 ? 'down' : 'stable';
    });

    // Top 10 serviços mais caros
    const serviceMap = new Map<string, ServiceSummary>();
    services.forEach(service => {
      serviceMap.set(service.id, {
        id: service.id,
        name: service.name,
        displayName: service.displayName,
        categoryName: service.category.name,
        totalCost: 0,
        percentage: 0,
        requestCount: 0,
        averageCost: 0,
        trend: 'stable',
      });
    });

    // Calcular custos por serviço
    currentMonthData.forEach(entry => {
      const service = serviceMap.get(entry.serviceId);
      if (service) {
        service.totalCost += entry.amount;
        service.requestCount += 1;
      }
    });

    // Calcular médias e percentuais
    serviceMap.forEach(service => {
      service.percentage = totalCost > 0 ? (service.totalCost / totalCost) * 100 : 0;
      service.averageCost = service.requestCount > 0 ? service.totalCost / service.requestCount : 0;
    });

    // Ordenar serviços por custo total
    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);

    // Alertas
    const alertSummaries: AlertSummary[] = alerts.map(alert => ({
      id: alert.id,
      type: alert.alertType,
      severity: alert.severity,
      message: alert.message,
      currentAmount: alert.currentCost,
      limitAmount: alert.limit,
      percentage: alert.percentage,
      createdAt: alert.createdAt,
    }));

    // Análise Fixo vs Variável
    const fixedCosts = currentMonthData
      .filter(entry => entry.service.costType === 'fixed')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const variableCosts = currentMonthData
      .filter(entry => entry.service.costType === 'variable')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const fixedVsVariable = {
      fixed: fixedCosts,
      variable: variableCosts,
      fixedPercentage: totalCost > 0 ? (fixedCosts / totalCost) * 100 : 0,
      variablePercentage: totalCost > 0 ? (variableCosts / totalCost) * 100 : 0,
    };

    const dashboard: CostDashboard = {
      totalCost,
      totalCostPreviousMonth,
      costVariation,
      projectedCost,
      categories: Array.from(categoryMap.values()),
      topServices,
      alerts: alertSummaries,
      trends: trendsData,
      fixedVsVariable,
    };

    // Cachear resultado
    if (config.costs.redisCacheEnabled) {
      try {
        await cache.set(cacheKey, JSON.stringify(dashboard), config.costs.cacheTtl);
      } catch (error) {
        logger.warn('Failed to cache dashboard:', error);
      }
    }

    return dashboard;
  }

  /**
   * Obter dados de tendência
   */
  async getTrendsData(months: number = 6): Promise<TrendData[]> {
    const now = new Date();
    const trends: TrendData[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const entries = await prisma.costEntry.findMany({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: {
          category: true,
        },
      });

      const totalCost = entries.reduce((sum, entry) => sum + entry.amount, 0);
      const categories: Record<string, number> = {};

      entries.forEach(entry => {
        const categoryName = entry.category.name;
        categories[categoryName] = (categories[categoryName] || 0) + entry.amount;
      });

      trends.push({
        date: monthStart.toISOString().split('T')[0],
        totalCost,
        categories,
      });
    }

    return trends;
  }

  /**
   * Obter comparação inteligente
   */
  async getSmartComparison(filters: CostFilters = {}): Promise<SmartComparison> {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Últimos 3 meses para média
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const [currentMonthData, averageData] = await Promise.all([
      prisma.costEntry.findMany({
        where: {
          ...this.buildWhereClause(filters),
          date: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
        include: {
          service: true,
          category: true,
        },
      }),
      prisma.costEntry.findMany({
        where: {
          ...this.buildWhereClause(filters),
          date: {
            gte: threeMonthsAgo,
            lt: currentMonthStart,
          },
        },
        include: {
          service: true,
          category: true,
        },
      }),
    ]);

    const currentTotal = currentMonthData.reduce((sum, entry) => sum + entry.amount, 0);
    const averageTotal = averageData.reduce((sum, entry) => sum + entry.amount, 0) / 3;
    const percentage = averageTotal > 0 ? ((currentTotal - averageTotal) / averageTotal) * 100 : 0;

    // Detectar anomalias (desvio > 2x)
    const serviceMap = new Map<string, { current: number; average: number; name: string }>();
    
    currentMonthData.forEach(entry => {
      const key = entry.serviceId;
      if (!serviceMap.has(key)) {
        serviceMap.set(key, { current: 0, average: 0, name: entry.service.displayName });
      }
      serviceMap.get(key)!.current += entry.amount;
    });

    averageData.forEach(entry => {
      const key = entry.serviceId;
      if (serviceMap.has(key)) {
        serviceMap.get(key)!.average += entry.amount / 3;
      }
    });

    const anomalies = Array.from(serviceMap.values())
      .map(service => {
        const deviation = service.average > 0 ? ((service.current - service.average) / service.average) * 100 : 0;
        return {
          service: service.name,
          current: service.current,
          average: service.average,
          deviation,
        };
      })
      .filter(service => Math.abs(service.deviation) > 200) // > 200% de desvio
      .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));

    // Tendências por categoria
    const categoryMap = new Map<string, { current: number; average: number; name: string }>();
    
    currentMonthData.forEach(entry => {
      const key = entry.categoryId;
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { current: 0, average: 0, name: entry.category.displayName });
      }
      categoryMap.get(key)!.current += entry.amount;
    });

    averageData.forEach(entry => {
      const key = entry.categoryId;
      if (categoryMap.has(key)) {
        categoryMap.get(key)!.average += entry.amount / 3;
      }
    });

    const trends = Array.from(categoryMap.values())
      .map(category => {
        const growth = category.average > 0 ? ((category.current - category.average) / category.average) * 100 : 0;
        return {
          category: category.name,
          growth,
          trend: growth > 10 ? 'up' as const : growth < -10 ? 'down' as const : 'stable' as const,
        };
      })
      .sort((a, b) => Math.abs(b.growth) - Math.abs(a.growth));

    return {
      currentVsAverage: {
        current: currentTotal,
        average: averageTotal,
        percentage,
        trend: percentage > 10 ? 'up' : percentage < -10 ? 'down' : 'stable',
      },
      anomalies,
      trends,
    };
  }

  /**
   * Criar entrada de custo
   */
  async createCostEntry(input: CostEntryInput): Promise<any> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const entry = await prisma.costEntry.create({
      data: {
        ...input,
        month,
        year,
        date: input.date || now,
        currency: input.currency || config.costs.defaultCurrency,
      },
      include: {
        category: true,
        service: true,
      },
    });

    // Invalidar cache
    await this.invalidateCache();

    // Verificar alertas
    await this.checkAlerts(entry);

    return entry;
  }

  /**
   * Atualizar entrada de custo
   */
  async updateCostEntry(id: string, input: Partial<CostEntryInput>): Promise<any> {
    const entry = await prisma.costEntry.update({
      where: { id },
      data: {
        ...input,
        updatedAt: new Date(),
      },
      include: {
        category: true,
        service: true,
      },
    });

    // Invalidar cache
    await this.invalidateCache();

    return entry;
  }

  /**
   * Deletar entrada de custo
   */
  async deleteCostEntry(id: string): Promise<void> {
    await prisma.costEntry.delete({
      where: { id },
    });

    // Invalidar cache
    await this.invalidateCache();
  }

  /**
   * Criar orçamento
   */
  async createBudget(input: BudgetInput): Promise<any> {
    const budget = await prisma.costBudget.create({
      data: {
        ...input,
        currency: input.currency || config.costs.defaultCurrency,
      },
      include: {
        category: true,
      },
    });

    return budget;
  }

  /**
   * Verificar alertas
   */
  private async checkAlerts(entry: any): Promise<void> {
    // Buscar orçamentos ativos
    const budgets = await prisma.costBudget.findMany({
      where: {
        isActive: true,
        OR: [
          { categoryId: entry.categoryId },
          { categoryId: null }, // Orçamento geral
        ],
      },
    });

    for (const budget of budgets) {
      // Calcular custo atual do período
      const startDate = budget.startDate;
      const endDate = budget.endDate || new Date();
      
      const currentCost = await prisma.costEntry.aggregate({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
        _sum: {
          amount: true,
        },
      });

      const totalCost = currentCost._sum.amount || 0;
      const percentage = (totalCost / budget.monthlyLimit) * 100;

      // Verificar se deve criar alerta
      let shouldAlert = false;
      let alertType = '';
      let severity = '';

      if (percentage >= 100) {
        shouldAlert = true;
        alertType = 'LIMIT_REACHED';
        severity = 'error';
      } else if (percentage >= config.costs.alertThresholds.critical && budget.alertAt90) {
        shouldAlert = true;
        alertType = 'CRITICAL';
        severity = 'error';
      } else if (percentage >= config.costs.alertThresholds.warning && budget.alertAt75) {
        shouldAlert = true;
        alertType = 'WARNING';
        severity = 'warning';
      }

      if (shouldAlert) {
        // Verificar se já existe alerta ativo
        const existingAlert = await prisma.costAlert.findFirst({
          where: {
            budgetId: budget.id,
            alertType,
            isActive: true,
          },
        });

        if (!existingAlert) {
          await prisma.costAlert.create({
            data: {
              budgetId: budget.id,
              alertType,
              currentCost: totalCost,
              limit: budget.monthlyLimit,
              percentage,
              message: this.generateAlertMessage(alertType, totalCost, budget.monthlyLimit, percentage),
              severity,
            },
          });
        }
      }
    }
  }

  /**
   * Gerar mensagem de alerta
   */
  private generateAlertMessage(type: string, current: number, limit: number, percentage: number): string {
    const currency = config.costs.defaultCurrency;
    
    switch (type) {
      case 'LIMIT_REACHED':
        return `Orçamento atingido! Gasto atual: ${currency} ${current.toFixed(2)} (${percentage.toFixed(1)}%)`;
      case 'CRITICAL':
        return `Alerta crítico! Gasto atual: ${currency} ${current.toFixed(2)} (${percentage.toFixed(1)}%) - próximo do limite`;
      case 'WARNING':
        return `Atenção! Gasto atual: ${currency} ${current.toFixed(2)} (${percentage.toFixed(1)}%) - monitorar custos`;
      default:
        return `Alerta de custos: ${currency} ${current.toFixed(2)}`;
    }
  }

  /**
   * Construir cláusula WHERE
   */
  private buildWhereClause(filters: CostFilters): any {
    const where: any = {};

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    return where;
  }

  /**
   * Invalidar cache
   */
  private async invalidateCache(): Promise<void> {
    if (!config.costs.redisCacheEnabled) return;

    try {
      // Invalidar todas as chaves de cache de custos
      const pattern = 'costs:*';
      // Nota: Redis não suporta KEYS em produção, mas para desenvolvimento está ok
      // Em produção, usar SCAN ou manter lista de chaves
      await cache.del(pattern);
    } catch (error) {
      logger.warn('Failed to invalidate cache:', error);
    }
  }

  /**
   * Obter categorias
   */
  async getCategories(): Promise<any[]> {
    return await prisma.costCategory.findMany({
      where: { isActive: true },
      orderBy: { displayName: 'asc' },
    });
  }

  /**
   * Obter serviços
   */
  async getServices(categoryId?: string): Promise<any[]> {
    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;

    return await prisma.costService.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { displayName: 'asc' },
    });
  }

  /**
   * Obter entradas de custo
   */
  async getCostEntries(filters: CostFilters = {}, page = 1, limit = 50): Promise<{
    entries: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where = this.buildWhereClause(filters);
    
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) where.date.lte = new Date(filters.endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.costEntry.findMany({
        where,
        include: {
          category: true,
          service: true,
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.costEntry.count({ where }),
    ]);

    return {
      entries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obter alertas
   */
  async getAlerts(status?: string): Promise<any[]> {
    const where: any = {};
    if (status) where.status = status;

    return await prisma.costAlert.findMany({
      where,
      include: {
        budget: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Reconhecer alerta
   */
  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<any> {
    return await prisma.costAlert.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });
  }

  /**
   * Exportar relatório
   */
  async exportReport(filters: CostFilters = {}, format: 'csv' | 'json' = 'csv'): Promise<string> {
    const entries = await prisma.costEntry.findMany({
      where: this.buildWhereClause(filters),
      include: {
        category: true,
        service: true,
      },
      orderBy: { date: 'desc' },
    });

    if (format === 'json') {
      return JSON.stringify(entries, null, 2);
    }

    // CSV
    const headers = [
      'Data',
      'Categoria',
      'Serviço',
      'Valor',
      'Moeda',
      'Tipo',
      'Descrição',
      'Tags',
      'Criado por',
    ];

    const rows = entries.map(entry => [
      entry.date.toISOString().split('T')[0],
      entry.category.displayName,
      entry.service.displayName,
      entry.amount.toString(),
      entry.currency,
      entry.entryType,
      entry.description || '',
      entry.tags.join(';'),
      entry.createdBy || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }
}

export const costManagementService = new CostManagementService();
