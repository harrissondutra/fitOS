import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  newRevenue: number;
  expansionRevenue: number;
  contractionRevenue: number;
  netRevenue: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
}

export interface RevenueTrend {
  date: string;
  mrr: number;
  arr: number;
  churnRate: number;
  newRevenue: number;
  expansionRevenue: number;
  contractionRevenue: number;
}

export interface CohortAnalysis {
  cohortMonth: string;
  cohortSize: number;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
  month6: number;
  month12: number;
}

export interface RevenueForecast {
  month: string;
  predictedMrr: number;
  predictedArr: number;
  confidence: number;
  factors: string[];
}

export class RevenueAnalyticsService {
  /**
   * Calcula métricas de receita atuais
   */
  async getCurrentRevenueMetrics(): Promise<RevenueMetrics> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Buscar todas as assinaturas ativas
      const activeSubscriptions = await prisma.subscription.findMany({
        where: { status: 'active' },
        include: { tenant: true }
      });

      // Calcular MRR
      const mrr = this.calculateMRR(activeSubscriptions);

      // Calcular ARR
      const arr = mrr * 12;

      // Calcular churn rate (últimos 30 dias)
      const churnRate = await this.calculateChurnRate(30);

      // Calcular receita nova (último mês)
      const newRevenue = await this.calculateNewRevenue(startOfMonth, now);

      // Calcular receita de expansão (último mês)
      const expansionRevenue = await this.calculateExpansionRevenue(startOfMonth, now);

      // Calcular receita de contração (último mês)
      const contractionRevenue = await this.calculateContractionRevenue(startOfMonth, now);

      // Receita líquida
      const netRevenue = newRevenue + expansionRevenue - contractionRevenue;

      // Calcular LTV
      const ltv = await this.calculateLTV();

      // Calcular CAC
      const cac = await this.calculateCAC();

      // LTV/CAC ratio
      const ltvCacRatio = cac > 0 ? ltv / cac : 0;

      return {
        mrr,
        arr,
        churnRate,
        newRevenue,
        expansionRevenue,
        contractionRevenue,
        netRevenue,
        ltv,
        cac,
        ltvCacRatio
      };
    } catch (error) {
      logger.error('Error calculating revenue metrics:', error);
      throw error;
    }
  }

  /**
   * Calcula MRR (Monthly Recurring Revenue)
   */
  private calculateMRR(subscriptions: any[]): number {
    return subscriptions.reduce((total, sub) => {
      if (sub.billingCycle === 'monthly') {
        return total + sub.amount;
      } else if (sub.billingCycle === 'yearly') {
        return total + (sub.amount / 12);
      }
      return total;
    }, 0);
  }

  /**
   * Calcula taxa de churn
   */
  private async calculateChurnRate(days: number): Promise<number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Contar tenants ativos no início do período
    const tenantsAtStart = await prisma.tenant.count({
      where: {
        status: 'active',
        createdAt: { lte: startDate }
      }
    });

    // Contar tenants que churnaram no período
    const churnedTenants = await prisma.tenant.count({
      where: {
        status: 'inactive',
        updatedAt: { gte: startDate, lte: endDate }
      }
    });

    if (tenantsAtStart === 0) return 0;

    return (churnedTenants / tenantsAtStart) * 100;
  }

  /**
   * Calcula receita nova
   */
  private async calculateNewRevenue(startDate: Date, endDate: Date): Promise<number> {
    const newSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        createdAt: { gte: startDate, lte: endDate }
      }
    });

    return this.calculateMRR(newSubscriptions);
  }

  /**
   * Calcula receita de expansão (upgrades)
   */
  private async calculateExpansionRevenue(startDate: Date, endDate: Date): Promise<number> {
    // Buscar mudanças de plano que resultaram em aumento de receita
    const planChanges = await prisma.auditLog.findMany({
      where: {
        action: 'update',
        entityType: 'Subscription',
        createdAt: { gte: startDate, lte: endDate },
        changes: {
          path: ['plan'],
          not: Prisma.JsonNull
        }
      },
      include: { tenant: true }
    });

    let expansionRevenue = 0;

    for (const change of planChanges) {
      if (change.tenant) {
        const oldPlan = this.getPlanValue(change.changes as string);
        const newPlan = this.getPlanValue(change.tenant.plan);
        
        if (newPlan > oldPlan) {
          expansionRevenue += newPlan - oldPlan;
        }
      }
    }

    return expansionRevenue;
  }

  /**
   * Calcula receita de contração (downgrades)
   */
  private async calculateContractionRevenue(startDate: Date, endDate: Date): Promise<number> {
    // Similar ao expansion, mas para downgrades
    const planChanges = await prisma.auditLog.findMany({
      where: {
        action: 'update',
        entityType: 'Subscription',
        createdAt: { gte: startDate, lte: endDate },
        changes: {
          path: ['plan'],
          not: Prisma.JsonNull
        }
      },
      include: { tenant: true }
    });

    let contractionRevenue = 0;

    for (const change of planChanges) {
      if (change.tenant) {
        const oldPlan = this.getPlanValue(change.changes as string);
        const newPlan = this.getPlanValue(change.tenant.plan);
        
        if (newPlan < oldPlan) {
          contractionRevenue += oldPlan - newPlan;
        }
      }
    }

    return contractionRevenue;
  }

  /**
   * Obtém valor do plano
   */
  private getPlanValue(plan: string): number {
    const planValues: { [key: string]: number } = {
      'trial': 0,
      'starter': 29,
      'basic': 59,
      'professional': 99,
      'enterprise': 199
    };

    return planValues[plan] || 0;
  }

  /**
   * Calcula LTV (Lifetime Value)
   */
  private async calculateLTV(): Promise<number> {
    try {
      // Calcular LTV médio baseado em dados históricos
      const subscriptions = await prisma.subscription.findMany({
        where: { status: 'active' },
        include: { tenant: true }
      });

      if (subscriptions.length === 0) return 0;

      const avgMrr = this.calculateMRR(subscriptions) / subscriptions.length;
      const avgChurnRate = await this.calculateChurnRate(365); // Churn anual
      
      if (avgChurnRate === 0) return avgMrr * 12; // Se não há churn, LTV = receita anual

      const avgLifetimeMonths = 100 / avgChurnRate; // Meses de vida média
      return avgMrr * avgLifetimeMonths;
    } catch (error) {
      logger.error('Error calculating LTV:', error);
      return 0;
    }
  }

  /**
   * Calcula CAC (Customer Acquisition Cost)
   */
  private async calculateCAC(): Promise<number> {
    try {
      // Para simplificar, assumir CAC baseado em marketing spend
      // Em um sistema real, isso viria de dados de marketing
      const marketingSpend = 10000; // Valor fixo por enquanto
      const newCustomers = await prisma.tenant.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      });

      return newCustomers > 0 ? marketingSpend / newCustomers : 0;
    } catch (error) {
      logger.error('Error calculating CAC:', error);
      return 0;
    }
  }

  /**
   * Obtém tendências de receita
   */
  async getRevenueTrends(months: number = 12): Promise<RevenueTrend[]> {
    try {
      const trends: RevenueTrend[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const subscriptions = await prisma.subscription.findMany({
          where: {
            status: 'active',
            createdAt: { lt: nextDate }
          }
        });

        const mrr = this.calculateMRR(subscriptions);
        const arr = mrr * 12;
        const churnRate = await this.calculateChurnRate(30);
        const newRevenue = await this.calculateNewRevenue(date, nextDate);
        const expansionRevenue = await this.calculateExpansionRevenue(date, nextDate);
        const contractionRevenue = await this.calculateContractionRevenue(date, nextDate);

        trends.push({
          date: date.toISOString().substring(0, 7), // YYYY-MM
          mrr,
          arr,
          churnRate,
          newRevenue,
          expansionRevenue,
          contractionRevenue
        });
      }

      return trends;
    } catch (error) {
      logger.error('Error getting revenue trends:', error);
      throw error;
    }
  }

  /**
   * Análise de coorte de retenção
   */
  async getCohortAnalysis(): Promise<CohortAnalysis[]> {
    try {
      const cohorts: CohortAnalysis[] = [];
      const now = new Date();

      // Analisar últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const cohortMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const cohortMonthStr = cohortMonth.toISOString().substring(0, 7);

        // Buscar tenants criados neste mês
        const cohortTenants = await prisma.tenant.findMany({
          where: {
            createdAt: {
              gte: cohortMonth,
              lt: new Date(cohortMonth.getFullYear(), cohortMonth.getMonth() + 1, 1)
            }
          },
          include: { subscriptions: true }
        });

        const cohortSize = cohortTenants.length;
        if (cohortSize === 0) continue;

        // Calcular retenção para cada mês
        const retention = await this.calculateCohortRetention(cohortTenants, cohortMonth);

        cohorts.push({
          cohortMonth: cohortMonthStr,
          cohortSize,
          month0: 100, // 100% no mês 0
          month1: retention.month1,
          month2: retention.month2,
          month3: retention.month3,
          month6: retention.month6,
          month12: retention.month12
        });
      }

      return cohorts;
    } catch (error) {
      logger.error('Error getting cohort analysis:', error);
      throw error;
    }
  }

  /**
   * Calcula retenção de coorte
   */
  private async calculateCohortRetention(tenants: any[], cohortMonth: Date) {
    const retention = {
      month1: 0,
      month2: 0,
      month3: 0,
      month6: 0,
      month12: 0
    };

    for (const tenant of tenants) {
      const tenantAge = Math.floor((Date.now() - new Date(tenant.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30));

      if (tenantAge >= 1 && tenant.status === 'active') retention.month1++;
      if (tenantAge >= 2 && tenant.status === 'active') retention.month2++;
      if (tenantAge >= 3 && tenant.status === 'active') retention.month3++;
      if (tenantAge >= 6 && tenant.status === 'active') retention.month6++;
      if (tenantAge >= 12 && tenant.status === 'active') retention.month12++;
    }

    const total = tenants.length;
    return {
      month1: total > 0 ? (retention.month1 / total) * 100 : 0,
      month2: total > 0 ? (retention.month2 / total) * 100 : 0,
      month3: total > 0 ? (retention.month3 / total) * 100 : 0,
      month6: total > 0 ? (retention.month6 / total) * 100 : 0,
      month12: total > 0 ? (retention.month12 / total) * 100 : 0
    };
  }

  /**
   * Previsão de receita
   */
  async getRevenueForecast(months: number = 6): Promise<RevenueForecast[]> {
    try {
      const trends = await this.getRevenueTrends(12);
      const forecast: RevenueForecast[] = [];

      // Calcular crescimento médio
      const growthRates = this.calculateGrowthRates(trends);
      const avgGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;

      const currentMrr = trends[trends.length - 1]?.mrr || 0;
      const currentArr = trends[trends.length - 1]?.arr || 0;

      for (let i = 1; i <= months; i++) {
        const forecastDate = new Date();
        forecastDate.setMonth(forecastDate.getMonth() + i);
        const monthStr = forecastDate.toISOString().substring(0, 7);

        const predictedMrr = currentMrr * Math.pow(1 + avgGrowthRate / 100, i);
        const predictedArr = predictedMrr * 12;

        // Calcular confiança baseada na consistência dos dados históricos
        const confidence = this.calculateForecastConfidence(growthRates);

        const factors = this.identifyForecastFactors(avgGrowthRate, i);

        forecast.push({
          month: monthStr,
          predictedMrr,
          predictedArr,
          confidence,
          factors
        });
      }

      return forecast;
    } catch (error) {
      logger.error('Error getting revenue forecast:', error);
      throw error;
    }
  }

  /**
   * Calcula taxas de crescimento
   */
  private calculateGrowthRates(trends: RevenueTrend[]): number[] {
    const rates: number[] = [];

    for (let i = 1; i < trends.length; i++) {
      const current = trends[i].mrr;
      const previous = trends[i - 1].mrr;

      if (previous > 0) {
        const rate = ((current - previous) / previous) * 100;
        rates.push(rate);
      }
    }

    return rates;
  }

  /**
   * Calcula confiança da previsão
   */
  private calculateForecastConfidence(growthRates: number[]): number {
    if (growthRates.length === 0) return 50;

    // Calcular desvio padrão
    const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / growthRates.length;
    const stdDev = Math.sqrt(variance);

    // Confiança inversamente proporcional ao desvio padrão
    const confidence = Math.max(30, 100 - (stdDev * 2));
    return Math.min(95, confidence);
  }

  /**
   * Identifica fatores da previsão
   */
  private identifyForecastFactors(growthRate: number, monthsAhead: number): string[] {
    const factors: string[] = [];

    if (growthRate > 5) factors.push('Strong historical growth');
    if (growthRate < -5) factors.push('Declining revenue trend');
    if (monthsAhead > 3) factors.push('Long-term forecast (less reliable)');
    if (growthRate > 0) factors.push('Positive momentum');
    if (growthRate < 0) factors.push('Negative momentum');

    return factors;
  }

  /**
   * Salva métricas de receita no banco
   */
  async saveRevenueMetrics(metrics: RevenueMetrics): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: 'system',
          userId: 'system',
          action: 'revenue_metrics_saved',
          entityType: 'RevenueMetrics',
          entityId: 'system',
          changes: {
            mrr: metrics.mrr,
            arr: metrics.arr,
            churnRate: metrics.churnRate,
            newRevenue: metrics.newRevenue,
            expansionRevenue: metrics.expansionRevenue,
            contractionRevenue: metrics.contractionRevenue,
            ltv: metrics.ltv,
            cac: metrics.cac,
            ltvCacRatio: metrics.ltvCacRatio
          }
        }
      });
    } catch (error) {
      logger.error('Error saving revenue metrics:', error);
      throw error;
    }
  }

  /**
   * Obtém receita por plano
   */
  async getRevenueByPlan(): Promise<{ plan: string; mrr: number; tenantCount: number }[]> {
    try {
      const subscriptions = await prisma.subscription.findMany({
        where: { status: 'active' },
        include: { tenant: true }
      });

      const planRevenue: { [key: string]: { mrr: number; tenantCount: number } } = {};

      for (const sub of subscriptions) {
        const plan = sub.tenant.plan;
        const mrr = sub.planId === 'monthly' ? 100 : 100 / 12; // Mock values for now

        if (!planRevenue[plan]) {
          planRevenue[plan] = { mrr: 0, tenantCount: 0 };
        }

        planRevenue[plan].mrr += mrr;
        planRevenue[plan].tenantCount += 1;
      }

      return Object.entries(planRevenue).map(([plan, data]) => ({
        plan,
        mrr: data.mrr,
        tenantCount: data.tenantCount
      }));
    } catch (error) {
      logger.error('Error getting revenue by plan:', error);
      throw error;
    }
  }
}

export const revenueAnalyticsService = new RevenueAnalyticsService();
