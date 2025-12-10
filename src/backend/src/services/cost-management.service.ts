import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { config } from '../config/config-simple';
import { logger } from '../utils/logger';
import { cache } from '../config/redis';
import { aiCostTrackingService } from './ai-cost-tracking.service';

const prisma = getPrismaClient();

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
    // Normalizar filtros para chave de cache consistente
    const normalizedFilters = {
      categoryId: filters.categoryId || undefined,
      serviceId: filters.serviceId || undefined,
      tenantId: filters.tenantId || undefined,
      clientId: filters.clientId || undefined,
    };
    const cacheKey = `costs:dashboard:${JSON.stringify(normalizedFilters)}`;

    // Tentar buscar do cache primeiro (com timeout)
    if (config.costs.redisCacheEnabled) {
      try {
        // Timeout de 2 segundos para cache - não esperar muito
        const cachePromise = cache.get(cacheKey);
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 2000);
        });

        const cached = await Promise.race([cachePromise, timeoutPromise]);      
        if (cached) {
          logger.info(`✅ Cache HIT for dashboard: ${cacheKey}`);
          return JSON.parse(cached);
        } else {
          logger.debug(`❌ Cache MISS for dashboard: ${cacheKey}`);
        }
      } catch (error) {
        logger.warn('Failed to get dashboard from cache:', error);
        // Continuar sem cache se houver erro
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

    // Buscar dados de IA se categoria for 'ai' ou se não houver filtro de categoria
    const shouldIncludeAICosts = !categoryId || categoryId === 'ai';
    let aiCostSummary = null;
    let aiCostSummaryPrevious = null;
    let aiServices: any[] = [];

        if (shouldIncludeAICosts) {
      try {
        // Timeout de 10 segundos para chamadas de IA
        const aiSummaryPromise = Promise.all([
          aiCostTrackingService.getCostSummary(start, end, clientId, undefined, undefined),                                                                     
          aiCostTrackingService.getCostSummary(previousMonthStart, previousMonthEnd, clientId, undefined, undefined)                                            
        ]);
        
        const timeoutPromise = new Promise<null[]>((resolve) => {
          setTimeout(() => {
            logger.warn('AI cost summary timeout - skipping AI costs');
            resolve([null, null]);
          }, 10000);
        });
        
        [aiCostSummary, aiCostSummaryPrevious] = await Promise.race([
          aiSummaryPromise,
          timeoutPromise
        ]);

        // Buscar serviços de IA (provedores e modelos) - com timeout
        const aiCostsPromise = prisma.aiCostTracking.findMany({
          where: {
            timestamp: {
              gte: start,
              lte: end,
            },
            ...(clientId && { clientId }),
          },
          select: {
            provider: true,
            model: true,
            cost: true,
          },
          take: 10000, // Limitar resultados para evitar queries muito grandes
        });
        
        const aiCostsTimeoutPromise = new Promise<any[]>((resolve) => {
          setTimeout(() => {
            logger.warn('AI costs query timeout - skipping AI services');
            resolve([]);
          }, 5000);
        });
        
        const aiCosts = await Promise.race([aiCostsPromise, aiCostsTimeoutPromise]);

        // Agrupar por provedor/modelo
        const serviceMap = new Map<string, { cost: number; count: number }>();
        aiCosts.forEach(cost => {
          const key = `${cost.provider}-${cost.model}`;
          const existing = serviceMap.get(key) || { cost: 0, count: 0 };
          serviceMap.set(key, {
            cost: existing.cost + (cost.cost || 0),
            count: existing.count + 1,
          });
        });

        aiServices = Array.from(serviceMap.entries()).map(([key, data]) => {
          const [provider, model] = key.split('-');
          return {
            id: key,
            name: key,
            displayName: `${provider} - ${model}`,
            categoryName: 'ai',
            totalCost: data.cost,
            percentage: 0, // Será calculado depois
            requestCount: data.count,
            averageCost: data.count > 0 ? data.cost / data.count : 0,
            trend: 'stable' as const,
          };
        });
      } catch (error) {
        logger.warn('Failed to fetch AI costs:', error);
        // Continuar sem dados de IA - não quebrar o dashboard
        aiCostSummary = null;
        aiCostSummaryPrevious = null;
        aiServices = [];
      }
    }

        // Buscar dados em paralelo - com timeout de 15 segundos
    const queriesPromise = Promise.all([
      // Dados do mês atual (com limite para evitar queries muito grandes)
      prisma.costEntry.findMany({
        where: whereClause,
        include: {
          category: true,
          service: true,
        },
        take: 50000, // Limitar resultados
        orderBy: { date: 'desc' }, // Ordenar por data mais recente primeiro
      }),

      // Dados do mês anterior (com limite)
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
        take: 50000, // Limitar resultados
        orderBy: { date: 'desc' },
      }),

      // Categorias (sem limite, mas geralmente são poucas)
      prisma.costCategory.findMany({
        where: { isActive: true },
        include: {
          services: {
            where: { isActive: true },
          },
        },
      }),

      // Serviços (sem limite, mas geralmente são poucos)
      prisma.costService.findMany({
        where: { isActive: true },
        include: {
          category: true,
        },
      }),

      // Alertas ativos (já limitado a 10)
      prisma.costAlert.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Dados de tendência (últimos 6 meses) - já otimizado
      this.getTrendsData(6, categoryId),
    ]);
    
        // Timeout de 15 segundos para queries principais (reduzido de 20s após otimização)
    const queriesTimeoutPromise = new Promise<any[]>((resolve) => {
      setTimeout(() => {
        logger.error('Dashboard queries timeout - returning partial data');     
        // Retornar arrays vazios para não quebrar o processamento
        resolve([[], [], [], [], [], []]);
      }, 15000); // 15 segundos de timeout
    });
    
    const [
      currentMonthData,
      previousMonthData,
      categories,
      services,
      alerts,
      trendsData,
    ] = await Promise.race([queriesPromise, queriesTimeoutPromise]);

    // Calcular totais (incluindo custos de IA)
    const totalCost = currentMonthData.reduce((sum, entry) => sum + entry.amount, 0) + (aiCostSummary?.totalCost || 0);
    const totalCostPreviousMonth = previousMonthData.reduce((sum, entry) => sum + entry.amount, 0) + (aiCostSummaryPrevious?.totalCost || 0);
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

    // Adicionar categoria de IA se não existir
    if (shouldIncludeAICosts && !categoryMap.has('ai')) {
      const aiCategory = categories.find(cat => cat.name === 'ai' || cat.id === 'ai');
      if (aiCategory) {
        categoryMap.set('ai', {
          id: aiCategory.id,
          name: aiCategory.name,
          displayName: aiCategory.displayName || 'Inteligência Artificial',
          icon: aiCategory.icon || 'Brain',
          color: aiCategory.color || '#8B5CF6',
          totalCost: 0,
          percentage: 0,
          previousMonthCost: 0,
          variation: 0,
          trend: 'stable',
        });
      } else {
        // Criar categoria de IA se não existir no banco
        categoryMap.set('ai', {
          id: 'ai',
          name: 'ai',
          displayName: 'Inteligência Artificial',
          icon: 'Brain',
          color: '#8B5CF6',
          totalCost: 0,
          percentage: 0,
          previousMonthCost: 0,
          variation: 0,
          trend: 'stable',
        });
      }
    }

    // Calcular custos por categoria (mês atual)
    currentMonthData.forEach(entry => {
      const category = categoryMap.get(entry.categoryId);
      if (category) {
        category.totalCost += entry.amount;
      }
    });

    // Adicionar custos de IA à categoria
    if (shouldIncludeAICosts && aiCostSummary) {
      const aiCategory = categoryMap.get('ai');
      if (aiCategory) {
        aiCategory.totalCost = aiCostSummary.totalCost || 0;
      }
    }

    // Calcular custos por categoria (mês anterior)
    previousMonthData.forEach(entry => {
      const category = categoryMap.get(entry.categoryId);
      if (category) {
        category.previousMonthCost += entry.amount;
      }
    });

    // Adicionar custos de IA do mês anterior
    if (shouldIncludeAICosts && aiCostSummaryPrevious) {
      const aiCategory = categoryMap.get('ai');
      if (aiCategory) {
        aiCategory.previousMonthCost = aiCostSummaryPrevious.totalCost || 0;
      }
    }

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

    // Adicionar serviços de IA
    if (shouldIncludeAICosts) {
      aiServices.forEach(service => {
        serviceMap.set(service.id, service);
      });
    }

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

        // Cachear resultado com TTL maior para dashboard (mínimo 15 minutos)
    const envDashboardTtl = parseInt(process.env.COST_CACHE_TTL_DASHBOARD || '1800', 10);
    const dashboardCacheTtl = Math.max(envDashboardTtl, 900); // Mínimo 15 minutos para evitar timeouts
    if (config.costs.redisCacheEnabled) {
      try {
        await cache.set(cacheKey, JSON.stringify(dashboard), dashboardCacheTtl);
        logger.info(`✅ Dashboard cached for ${dashboardCacheTtl} seconds`);
      } catch (error) {
        logger.warn('Failed to cache dashboard:', error);
      }
    }

    return dashboard;
  }

    /**
   * Obter dados de tendência
   * Otimizado para fazer uma única query agregada ao invés de múltiplas queries no loop
   */
  async getTrendsData(months: number = 6, categoryFilter?: string): Promise<TrendData[]> {
    // Cache individual para trends data
    const trendsCacheKey = `costs:trends:${months}:${categoryFilter || 'all'}`;
    
    if (config.costs.redisCacheEnabled) {
      try {
        const cachePromise = cache.get(trendsCacheKey);
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 2000);
        });

        const cached = await Promise.race([cachePromise, timeoutPromise]);
        if (cached) {
          logger.debug(`✅ Cache HIT for trends: ${trendsCacheKey}`);
          return JSON.parse(cached);
        }
      } catch (error) {
        logger.warn('Failed to get trends from cache:', error);
      }
    }

    const now = new Date();
    const trends: TrendData[] = [];
    const shouldIncludeAI = !categoryFilter || categoryFilter === 'ai';

    // Calcular range de datas (primeiro mês ao último mês)
    const firstMonthStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    try {
      // Timeout de 8 segundos para toda a query de tendências
      const entriesPromise = prisma.costEntry.findMany({
        where: {
          date: {
            gte: firstMonthStart,
            lte: lastMonthEnd,
          },
          ...(categoryFilter && categoryFilter !== 'ai' && { categoryId: categoryFilter }),
        },
        select: {
          date: true,
          amount: true,
          category: {
            select: {
              name: true,
            },
          },
        },
        // Limitar resultados para evitar queries muito grandes
        take: 50000,
      });

      const entriesTimeoutPromise = new Promise<any[]>((resolve) => {
        setTimeout(() => {
          logger.warn('Trends entries query timeout - returning empty entries');
          resolve([]);
        }, 8000); // 8 segundos de timeout
      });

      const entries = await Promise.race([entriesPromise, entriesTimeoutPromise]);

      // Agrupar entries por mês
      const entriesByMonth = new Map<string, typeof entries>();
      
      entries.forEach(entry => {
        const monthKey = entry.date.toISOString().substring(0, 7); // YYYY-MM
        if (!entriesByMonth.has(monthKey)) {
          entriesByMonth.set(monthKey, []);
        }
        entriesByMonth.get(monthKey)!.push(entry);
      });

      // Buscar custos de IA agrupados por mês (se necessário)
      const aiCostsByMonth = new Map<string, number>();
      if (shouldIncludeAI) {
        try {
          // Buscar todos os custos de IA do período e agrupar por mês
          const aiCostsPromise = prisma.aiCostTracking.findMany({
            where: {
              timestamp: {
                gte: firstMonthStart,
                lte: lastMonthEnd,
              },
            },
            select: {
              timestamp: true,
              cost: true,
            },
            take: 50000, // Limitar para evitar queries muito grandes
          });

          const aiCostsTimeoutPromise = new Promise<any[]>((resolve) => {
            setTimeout(() => {
              logger.warn('AI costs query for trends timeout');
              resolve([]);
            }, 5000); // 5 segundos de timeout
          });

          const aiCosts = await Promise.race([aiCostsPromise, aiCostsTimeoutPromise]);
          
          // Agrupar por mês
          aiCosts.forEach(aiCost => {
            const monthKey = aiCost.timestamp.toISOString().substring(0, 7);
            const currentCost = aiCostsByMonth.get(monthKey) || 0;
            aiCostsByMonth.set(monthKey, currentCost + (aiCost.cost || 0));
          });
        } catch (error) {
          logger.warn('Failed to get AI costs for trends:', error);
          // Continuar sem custos de IA
        }
      }

      // Processar cada mês
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = monthStart.toISOString().substring(0, 7);
        const monthEntries = entriesByMonth.get(monthKey) || [];

        const totalCost = monthEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const categories: Record<string, number> = {};

        monthEntries.forEach(entry => {
          const categoryName = entry.category.name;
          categories[categoryName] = (categories[categoryName] || 0) + entry.amount;
        });

        // Adicionar custos de IA do mês
        if (shouldIncludeAI) {
          const aiMonthCost = aiCostsByMonth.get(monthKey) || 0;
          if (aiMonthCost > 0) {
            categories['ai'] = (categories['ai'] || 0) + aiMonthCost;
          }
        }

        trends.push({
          date: monthStart.toISOString().split('T')[0],
          totalCost: totalCost + (categories['ai'] || 0),
          categories,
        });
      }

      // Cachear resultado de trends (mínimo 15 minutos)
      const envTrendsTtl = parseInt(process.env.COST_CACHE_TTL_DASHBOARD || '1800', 10);
      const trendsCacheTtl = Math.max(envTrendsTtl, 900); // Mínimo 15 minutos
      if (config.costs.redisCacheEnabled) {
        try {
          await cache.set(trendsCacheKey, JSON.stringify(trends), trendsCacheTtl);
          logger.debug(`✅ Trends cached for ${trendsCacheTtl} seconds`);
        } catch (error) {
          logger.warn('Failed to cache trends:', error);
        }
      }
    } catch (error) {
      logger.error('Error getting trends data:', error);
      // Retornar array vazio se houver erro crítico
      return [];
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
    const services: any[] = [];

    // Se não há filtro de categoria ou categoria é 'ai', incluir serviços de IA
    if (!categoryId || categoryId === 'ai') {
      try {
        // Buscar provedores e configurações de serviços cadastrados
        const [providers, serviceConfigs, aiCosts] = await Promise.all([
          prisma.aiProvider.findMany({
            where: { isActive: true },
            select: {
              id: true,
              provider: true,
              name: true,
              displayName: true,
            },
          }),
          prisma.aiServiceConfig.findMany({
            where: { isActive: true },
            select: {
              id: true,
              serviceType: true,
              serviceName: true,
              model: true,
              providerId: true,
              provider: {
                select: {
                  id: true,
                  provider: true,
                  name: true,
                  displayName: true,
                },
              },
            },
          }),
            // Buscar TODOS os custos de IA (não apenas últimos 30 dias)
          // Isso garante que todos os custos registrados sejam exibidos
          prisma.aiCostTracking.findMany({
            select: {
              provider: true,
              model: true,
              cost: true,
              timestamp: true,
              inputTokens: true,
              outputTokens: true,
            },
            orderBy: {
              timestamp: 'desc'
            },
          }),
        ]);

        // Agrupar custos por provedor/modelo
        const costMap = new Map<string, { cost: number; count: number }>();
        aiCosts.forEach(cost => {
          const key = `${cost.provider}-${cost.model}`;
          const existing = costMap.get(key) || { cost: 0, count: 0 };
          costMap.set(key, {
            cost: existing.cost + (cost.cost || 0),
            count: existing.count + 1,
          });
        });

        // Criar mapa de serviços únicos (provedor + modelo)
        const serviceMap = new Map<string, any>();

        // PRIMEIRO: Adicionar TODOS os serviços baseados nas configurações cadastradas
        // Isso garante que mesmo serviços sem custos apareçam
        serviceConfigs.forEach(config => {
          const provider = config.provider;
          const key = `${provider.provider}-${config.model}`;
          
          if (!serviceMap.has(key)) {
            const costData = costMap.get(key) || { cost: 0, count: 0 };
            
            serviceMap.set(key, {
              id: key,
              name: key,
              displayName: `${provider.displayName || provider.name} - ${config.model}`,
              categoryId: 'ai',
              category: {
                id: 'ai',
                name: 'ai',
                displayName: 'Inteligência Artificial',
                icon: 'Brain',
                color: '#8B5CF6',
              },
              costType: 'variable',
              captureType: 'usage_tracking',
              isActive: true,
              provider: provider.provider,
              providerId: provider.id,
              providerName: provider.displayName || provider.name,
              model: config.model,
              serviceType: config.serviceType,
              serviceName: config.serviceName,
              totalCost: costData.cost,
              requestCount: costData.count,
              averageCost: costData.count > 0 ? costData.cost / costData.count : 0,
              trend: 'stable' as const,
              metadata: {
                provider: provider.provider,
                providerId: provider.id,
                model: config.model,
                serviceType: config.serviceType,
                serviceName: config.serviceName,
                totalCost: costData.cost,
                requestCount: costData.count,
              },
            });
          } else {
            // Atualizar dados de custo se já existir
            const existing = serviceMap.get(key);
            const costData = costMap.get(key) || { cost: 0, count: 0 };
            existing.totalCost = costData.cost;
            existing.requestCount = costData.count;
            existing.averageCost = costData.count > 0 ? costData.cost / costData.count : 0;
            existing.metadata.totalCost = costData.cost;
            existing.metadata.requestCount = costData.count;
          }
        });

        // SEGUNDO: Adicionar serviços que têm custos mas podem não estar cadastrados
        // Isso garante que serviços com uso apareçam mesmo sem configuração
        costMap.forEach((costData, key) => {
          if (!serviceMap.has(key)) {
            const [provider, model] = key.split('-');
            serviceMap.set(key, {
              id: key,
              name: key,
              displayName: `${provider} - ${model}`,
              categoryId: 'ai',
              category: {
                id: 'ai',
                name: 'ai',
                displayName: 'Inteligência Artificial',
                icon: 'Brain',
                color: '#8B5CF6',
              },
              costType: 'variable',
              captureType: 'usage_tracking',
              isActive: true,
              provider,
              model,
              totalCost: costData.cost,
              requestCount: costData.count,
              averageCost: costData.count > 0 ? costData.cost / costData.count : 0,
              trend: 'stable' as const,
              metadata: {
                provider,
                model,
                totalCost: costData.cost,
                requestCount: costData.count,
              },
            });
          }
        });

        // TERCEIRO: Se não houver serviços cadastrados, mas houver provedores ativos,
        // criar serviços baseados apenas nos provedores (sem modelos específicos)
        if (serviceMap.size === 0 && providers.length > 0) {
          providers.forEach(provider => {
            const key = `${provider.provider}-all`;
            if (!serviceMap.has(key)) {
              serviceMap.set(key, {
                id: key,
                name: key,
                displayName: `${provider.displayName || provider.name} (Todos os modelos)`,
                categoryId: 'ai',
                category: {
                  id: 'ai',
                  name: 'ai',
                  displayName: 'Inteligência Artificial',
                  icon: 'Brain',
                  color: '#8B5CF6',
                },
                costType: 'variable',
                captureType: 'usage_tracking',
                isActive: true,
                provider: provider.provider,
                providerId: provider.id,
                providerName: provider.displayName || provider.name,
                model: 'all',
                totalCost: 0,
                requestCount: 0,
                averageCost: 0,
                trend: 'stable' as const,
                metadata: {
                  provider: provider.provider,
                  providerId: provider.id,
                  model: 'all',
                  totalCost: 0,
                  requestCount: 0,
                },
              });
            }
          });
        }

        // Adicionar todos os serviços ao array, ordenados por custo total (decrescente)
        const sortedServices = Array.from(serviceMap.values()).sort((a, b) => b.totalCost - a.totalCost);
        services.push(...sortedServices);
      } catch (error) {
        logger.error('Failed to fetch AI services:', error);
        // Em caso de erro, tentar buscar apenas pelos custos
              try {
                // Buscar TODOS os custos de IA (não apenas últimos 30 dias)
                const aiCosts = await prisma.aiCostTracking.findMany({
                  select: {
                    provider: true,
                    model: true,
                    cost: true,
                    timestamp: true,
                    inputTokens: true,
                    outputTokens: true,
                  },
                  orderBy: {
                    timestamp: 'desc'
                  },
                });

          const serviceMap = new Map<string, { cost: number; count: number }>();
          aiCosts.forEach(cost => {
            const key = `${cost.provider}-${cost.model}`;
            const existing = serviceMap.get(key) || { cost: 0, count: 0 };
            serviceMap.set(key, {
              cost: existing.cost + (cost.cost || 0),
              count: existing.count + 1,
            });
          });

          Array.from(serviceMap.entries()).forEach(([key, data]) => {
            const [provider, model] = key.split('-');
            services.push({
              id: key,
              name: key,
              displayName: `${provider} - ${model}`,
              categoryId: 'ai',
              category: {
                id: 'ai',
                name: 'ai',
                displayName: 'Inteligência Artificial',
                icon: 'Brain',
                color: '#8B5CF6',
              },
              costType: 'variable',
              captureType: 'usage_tracking',
              isActive: true,
              totalCost: data.cost,
              requestCount: data.count,
              metadata: {
                provider,
                model,
                totalCost: data.cost,
                requestCount: data.count,
              },
            });
          });
        } catch (fallbackError) {
          logger.error('Failed to fetch AI services (fallback):', fallbackError);
        }
      }
    }

    // Buscar serviços normais se não for apenas IA
    if (!categoryId || categoryId !== 'ai') {
      const where: any = { isActive: true };
      if (categoryId) where.categoryId = categoryId;

      const normalServices = await prisma.costService.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: { displayName: 'asc' },
      });

      services.push(...normalServices);
    }

    return services;
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
