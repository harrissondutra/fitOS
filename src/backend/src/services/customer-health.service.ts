import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CustomerHealthData {
  tenantId: string;
  tenantName: string;
  healthScore: number;
  usageScore: number;
  adoptionScore: number;
  supportScore: number;
  paymentScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastCalculated: Date;
  riskFactors: string[];
  recommendedActions: string[];
  trend: 'improving' | 'stable' | 'declining';
  previousScore?: number;
}

export interface HealthMetrics {
  totalTenants: number;
  healthyTenants: number;
  atRiskTenants: number;
  criticalTenants: number;
  avgHealthScore: number;
  healthScoreDistribution: {
    excellent: number; // 80-100
    good: number;      // 60-79
    fair: number;      // 40-59
    poor: number;      // 20-39
    critical: number;  // 0-19
  };
}

export interface HealthTrend {
  date: string;
  avgHealthScore: number;
  healthyCount: number;
  atRiskCount: number;
  criticalCount: number;
}

export class CustomerHealthService {
  /**
   * Calcula health score de todos os tenants
   */
  async calculateAllCustomerHealth(): Promise<CustomerHealthData[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { status: 'active' },
        include: {
          users: true,
          subscriptions: true,
          usageTracking: true,
          auditLogs: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      });

      const healthData: CustomerHealthData[] = [];

      for (const tenant of tenants) {
        const data = await this.calculateCustomerHealth(tenant);
        healthData.push(data);
      }

      return healthData.sort((a, b) => b.healthScore - a.healthScore);
    } catch (error) {
      logger.error('Error calculating customer health:', error);
      throw error;
    }
  }

  /**
   * Calcula health score de um tenant específico
   */
  async calculateCustomerHealth(tenant: any): Promise<CustomerHealthData> {
    const now = new Date();

    // Calcular scores individuais
    const usageScore = await this.calculateUsageScore(tenant);
    const adoptionScore = await this.calculateAdoptionScore(tenant);
    const supportScore = await this.calculateSupportScore(tenant);
    const paymentScore = await this.calculatePaymentScore(tenant);

    // Calcular health score total (média ponderada)
    const healthScore = Math.round(
      (usageScore * 0.4) + 
      (adoptionScore * 0.3) + 
      (supportScore * 0.2) + 
      (paymentScore * 0.1)
    );

    // Determinar nível de risco
    const riskLevel = this.determineRiskLevel(healthScore);

    // Identificar fatores de risco
    const riskFactors = this.identifyRiskFactors(tenant, usageScore, adoptionScore, supportScore, paymentScore);

    // Gerar ações recomendadas
    const recommendedActions = this.generateRecommendedActions(healthScore, riskLevel, riskFactors);

    // Calcular tendência
    const trend = await this.calculateHealthTrend(tenant.id, healthScore);

    // Buscar score anterior para comparação
    const previousScore = await this.getPreviousHealthScore(tenant.id);

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      healthScore,
      usageScore,
      adoptionScore,
      supportScore,
      paymentScore,
      riskLevel,
      lastCalculated: now,
      riskFactors,
      recommendedActions,
      trend,
      previousScore
    };
  }

  /**
   * Calcula score de uso (0-100)
   */
  private async calculateUsageScore(tenant: any): Promise<number> {
    let score = 0;

    // 1. Atividade de usuários (50 pontos)
    const activeUsers = tenant.users.filter((user: any) => 
      user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const totalUsers = tenant.users.length;
    const userActivityScore = totalUsers > 0 ? (activeUsers / totalUsers) * 50 : 0;
    score += userActivityScore;

    // 2. Frequência de uso (30 pontos)
    const usageFrequency = await this.calculateUsageFrequency(tenant.id);
    score += usageFrequency;

    // 3. Duração das sessões (20 pontos)
    const sessionDuration = await this.calculateSessionDuration(tenant.id);
    score += sessionDuration;

    return Math.min(100, score);
  }

  /**
   * Calcula score de adoção (0-100)
   */
  private async calculateAdoptionScore(tenant: any): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Buscar features usadas
      const featureUsage = await prisma.usageTracking.findMany({
        where: {
          tenantId: tenant.id,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { eventType: true, metadata: true }
      });

      if (featureUsage.length === 0) return 0;

      // Calcular diversidade de features (40 pontos)
      const uniqueFeatures = new Set(featureUsage.map(f => f.eventType)).size;
      const diversityScore = Math.min(40, uniqueFeatures * 4);

      // Calcular intensidade de uso (40 pontos)
      const totalUsage = featureUsage.reduce((sum, f) => sum + ((f.metadata as any)?.usageCount || 1), 0);
      const intensityScore = Math.min(40, totalUsage / 10);

      // Calcular adoção por usuário (20 pontos)
      const avgUsagePerUser = totalUsage / tenant.users.length;
      const adoptionScore = Math.min(20, avgUsagePerUser * 2);

      return diversityScore + intensityScore + adoptionScore;
    } catch (error) {
      logger.error('Error calculating adoption score:', error);
      return 0;
    }
  }

  /**
   * Calcula score de suporte (0-100)
   */
  private async calculateSupportScore(tenant: any): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Buscar tickets de suporte (assumindo que existem em auditLogs)
      const supportTickets = await prisma.auditLog.count({
        where: {
          tenantId: tenant.id,
          action: 'support_ticket',
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // Buscar resoluções de tickets
      const resolvedTickets = await prisma.auditLog.count({
        where: {
          tenantId: tenant.id,
          action: 'support_ticket_resolved',
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // Score baseado na resolução de tickets
      if (supportTickets === 0) return 100; // Sem tickets = bom score
      
      const resolutionRate = resolvedTickets / supportTickets;
      return Math.round(resolutionRate * 100);
    } catch (error) {
      logger.error('Error calculating support score:', error);
      return 50; // Score neutro em caso de erro
    }
  }

  /**
   * Calcula score de pagamento (0-100)
   */
  private calculatePaymentScore(tenant: any): number {
    if (!tenant.subscriptions || tenant.subscriptions.length === 0) return 0;

    const activeSubscription = tenant.subscriptions.find((sub: any) => sub.status === 'active');
    if (!activeSubscription) return 0;

    // Verificar se está em dia
    const now = new Date();
    const nextBilling = new Date(activeSubscription.nextBillingDate);
    
    if (nextBilling > now) return 100; // Em dia
    if (nextBilling > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return 80; // 1 semana atrasado
    if (nextBilling > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return 60; // 1 mês atrasado
    if (nextBilling > new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)) return 40; // 2 meses atrasado
    return 0; // Muito atrasado
  }

  /**
   * Calcula frequência de uso
   */
  private async calculateUsageFrequency(tenantId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const usageCount = await prisma.usageTracking.count({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // Normalizar baseado no número de usos
      if (usageCount === 0) return 0;
      if (usageCount < 10) return 10;
      if (usageCount < 50) return 20;
      if (usageCount < 100) return 25;
      return 30;
    } catch (error) {
      logger.error('Error calculating usage frequency:', error);
      return 0;
    }
  }

  /**
   * Calcula duração das sessões
   */
  private async calculateSessionDuration(tenantId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Buscar logs de sessão
      const sessionLogs = await prisma.auditLog.findMany({
        where: {
          tenantId,
          action: { in: ['login', 'logout'] },
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { action: true, createdAt: true },
        orderBy: { createdAt: 'asc' }
      });

      let totalDuration = 0;
      let sessionCount = 0;
      let loginTime: Date | null = null;

      for (const log of sessionLogs) {
        if (log.action === 'login') {
          loginTime = log.createdAt;
        } else if (log.action === 'logout' && loginTime) {
          const duration = (log.createdAt.getTime() - loginTime.getTime()) / (1000 * 60); // minutos
          totalDuration += duration;
          sessionCount++;
          loginTime = null;
        }
      }

      const avgDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;

      // Normalizar baseado na duração média
      if (avgDuration < 5) return 0;
      if (avgDuration < 15) return 5;
      if (avgDuration < 30) return 10;
      if (avgDuration < 60) return 15;
      return 20;
    } catch (error) {
      logger.error('Error calculating session duration:', error);
      return 0;
    }
  }

  /**
   * Determina nível de risco
   */
  private determineRiskLevel(healthScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (healthScore >= 80) return 'low';
    if (healthScore >= 60) return 'medium';
    if (healthScore >= 40) return 'high';
    return 'critical';
  }

  /**
   * Identifica fatores de risco
   */
  private identifyRiskFactors(
    tenant: any, 
    usageScore: number, 
    adoptionScore: number, 
    supportScore: number, 
    paymentScore: number
  ): string[] {
    const riskFactors: string[] = [];

    if (usageScore < 30) riskFactors.push('Low usage activity');
    if (adoptionScore < 30) riskFactors.push('Poor feature adoption');
    if (supportScore < 50) riskFactors.push('Support issues');
    if (paymentScore < 60) riskFactors.push('Payment problems');

    // Verificar atividade de usuários
    const activeUsers = tenant.users.filter((user: any) => 
      user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (activeUsers === 0) riskFactors.push('No active users');
    if (activeUsers < tenant.users.length * 0.2) riskFactors.push('Very low user activity');

    // Verificar crescimento
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(tenant.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreation > 90 && tenant.users.length < 5) {
      riskFactors.push('Slow growth');
    }

    return riskFactors;
  }

  /**
   * Gera ações recomendadas
   */
  private generateRecommendedActions(
    healthScore: number, 
    riskLevel: string, 
    riskFactors: string[]
  ): string[] {
    const actions: string[] = [];

    if (riskLevel === 'critical') {
      actions.push('Immediate intervention required');
      actions.push('Schedule emergency call');
      actions.push('Offer free consultation');
    }

    if (riskLevel === 'high') {
      actions.push('Schedule check-in call');
      actions.push('Send health check email');
      actions.push('Offer training session');
    }

    if (riskFactors.includes('Low usage activity')) {
      actions.push('Send usage tips email');
      actions.push('Offer product demo');
    }

    if (riskFactors.includes('Poor feature adoption')) {
      actions.push('Send feature highlights');
      actions.push('Schedule feature walkthrough');
    }

    if (riskFactors.includes('Support issues')) {
      actions.push('Assign dedicated support');
      actions.push('Review support tickets');
    }

    if (riskFactors.includes('Payment problems')) {
      actions.push('Contact billing team');
      actions.push('Offer payment plan');
    }

    if (healthScore < 50) {
      actions.push('Create success plan');
      actions.push('Assign customer success manager');
    }

    return actions;
  }

  /**
   * Calcula tendência do health score
   */
  private async calculateHealthTrend(tenantId: string, currentScore: number): Promise<'improving' | 'stable' | 'declining'> {
    try {
      // Buscar score anterior (30 dias atrás)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const previousHealth = await prisma.auditLog.findFirst({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!previousHealth) return 'stable';

      const scoreDiff = currentScore - ((previousHealth.changes as any)?.score || 0);
      
      if (scoreDiff > 10) return 'improving';
      if (scoreDiff < -10) return 'declining';
      return 'stable';
    } catch (error) {
      logger.error('Error calculating health trend:', error);
      return 'stable';
    }
  }

  /**
   * Obtém score anterior
   */
  private async getPreviousHealthScore(tenantId: string): Promise<number | undefined> {
    try {
      const previousHealth = await prisma.auditLog.findFirst({
        where: { tenantId },
        orderBy: { createdAt: 'desc' }
      });

      return (previousHealth?.changes as any)?.score;
    } catch (error) {
      logger.error('Error getting previous health score:', error);
      return undefined;
    }
  }

  /**
   * Salva health score no banco
   */
  async saveHealthScore(healthData: CustomerHealthData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: healthData.tenantId,
          userId: 'system',
          action: 'customer_health_score_saved',
          entityType: 'CustomerHealthScore',
          entityId: healthData.tenantId,
          changes: {
            healthScore: healthData.healthScore,
            usageScore: healthData.usageScore,
            adoptionScore: healthData.adoptionScore,
            supportScore: healthData.supportScore,
            paymentScore: healthData.paymentScore,
            riskLevel: healthData.riskLevel,
            lastCalculated: healthData.lastCalculated
          }
        }
      });
    } catch (error) {
      logger.error('Error saving health score:', error);
      throw error;
    }
  }

  /**
   * Obtém métricas gerais de health
   */
  async getHealthMetrics(): Promise<HealthMetrics> {
    try {
      const allHealthData = await this.calculateAllCustomerHealth();
      
      const totalTenants = allHealthData.length;
      const healthyTenants = allHealthData.filter(h => h.riskLevel === 'low').length;
      const atRiskTenants = allHealthData.filter(h => h.riskLevel === 'medium' || h.riskLevel === 'high').length;
      const criticalTenants = allHealthData.filter(h => h.riskLevel === 'critical').length;
      
      const avgHealthScore = totalTenants > 0 
        ? allHealthData.reduce((sum, h) => sum + h.healthScore, 0) / totalTenants 
        : 0;

      const healthScoreDistribution = {
        excellent: allHealthData.filter(h => h.healthScore >= 80).length,
        good: allHealthData.filter(h => h.healthScore >= 60 && h.healthScore < 80).length,
        fair: allHealthData.filter(h => h.healthScore >= 40 && h.healthScore < 60).length,
        poor: allHealthData.filter(h => h.healthScore >= 20 && h.healthScore < 40).length,
        critical: allHealthData.filter(h => h.healthScore < 20).length
      };

      return {
        totalTenants,
        healthyTenants,
        atRiskTenants,
        criticalTenants,
        avgHealthScore,
        healthScoreDistribution
      };
    } catch (error) {
      logger.error('Error getting health metrics:', error);
      throw error;
    }
  }

  /**
   * Obtém tendências de health ao longo do tempo
   */
  async getHealthTrends(months: number = 6): Promise<HealthTrend[]> {
    try {
      const trends: HealthTrend[] = [];
      const now = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        // Buscar health scores do período
        const healthScores = await prisma.auditLog.findMany({
          where: {
            createdAt: { gte: date, lt: nextDate }
          },
          select: { changes: true }
        });

        if (healthScores.length === 0) continue;

        const avgHealthScore = healthScores.reduce((sum, h) => sum + ((h.changes as any)?.score || 0), 0) / healthScores.length;
        const healthyCount = healthScores.filter(h => (h.changes as any)?.riskLevel === 'low').length;
        const atRiskCount = healthScores.filter(h => (h.changes as any)?.riskLevel === 'medium' || (h.changes as any)?.riskLevel === 'high').length;
        const criticalCount = healthScores.filter(h => (h.changes as any)?.riskLevel === 'critical').length;

        trends.push({
          date: date.toISOString().substring(0, 7),
          avgHealthScore: Math.round(avgHealthScore),
          healthyCount,
          atRiskCount,
          criticalCount
        });
      }

      return trends;
    } catch (error) {
      logger.error('Error getting health trends:', error);
      throw error;
    }
  }

  /**
   * Identifica tenants em risco
   */
  async getAtRiskTenants(): Promise<CustomerHealthData[]> {
    try {
      const allHealthData = await this.calculateAllCustomerHealth();
      
      return allHealthData
        .filter(h => h.riskLevel === 'high' || h.riskLevel === 'critical')
        .sort((a, b) => a.healthScore - b.healthScore); // Ordenar por menor score primeiro
    } catch (error) {
      logger.error('Error getting at-risk tenants:', error);
      throw error;
    }
  }

  /**
   * Identifica tenants com tendência de melhoria
   */
  async getImprovingTenants(): Promise<CustomerHealthData[]> {
    try {
      const allHealthData = await this.calculateAllCustomerHealth();
      
      return allHealthData
        .filter(h => h.trend === 'improving')
        .sort((a, b) => b.healthScore - a.healthScore);
    } catch (error) {
      logger.error('Error getting improving tenants:', error);
      throw error;
    }
  }
}

export const customerHealthService = new CustomerHealthService();
