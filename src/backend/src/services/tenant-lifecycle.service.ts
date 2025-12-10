import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

const prisma = getPrismaClient();

export interface TenantLifecycleData {
  tenantId: string;
  stage: 'trial' | 'active' | 'at_risk' | 'churned' | 'suspended';
  daysInStage: number;
  healthScore: number;
  lastActivity: Date;
  nextAction?: string;
  riskFactors: string[];
}

export interface ChurnPrediction {
  tenantId: string;
  churnProbability: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: string[];
  recommendedActions: string[];
  daysToChurn?: number;
}

export class TenantLifecycleService {
  /**
   * Analisa o ciclo de vida de todos os tenants
   */
  async analyzeAllTenants(): Promise<TenantLifecycleData[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        include: {
          users: true,
          subscriptions: true,
          auditLogs: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
              }
            }
          }
        }
      });

      const lifecycleData: TenantLifecycleData[] = [];

      for (const tenant of tenants) {
        const data = await this.analyzeTenantLifecycle(tenant);
        lifecycleData.push(data);
      }

      return lifecycleData;
    } catch (error) {
      logger.error('Error analyzing tenant lifecycle:', error);
      throw error;
    }
  }

  /**
   * Analisa o ciclo de vida de um tenant específico
   */
  async analyzeTenantLifecycle(tenant: any): Promise<TenantLifecycleData> {
    const now = new Date();
    const createdAt = new Date(tenant.createdAt);
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Calcular health score
    const healthScore = await this.calculateHealthScore(tenant);

    // Determinar estágio atual
    const stage = this.determineTenantStage(tenant, healthScore, daysSinceCreation);

    // Calcular dias no estágio atual
    const daysInStage = this.calculateDaysInStage(tenant, stage);

    // Identificar fatores de risco
    const riskFactors = this.identifyRiskFactors(tenant, healthScore);

    // Determinar próxima ação
    const nextAction = this.determineNextAction(stage, riskFactors, healthScore);

    // Última atividade
    const lastActivity = this.getLastActivity(tenant);

    return {
      tenantId: tenant.id,
      stage: stage as 'trial' | 'active' | 'at_risk' | 'churned' | 'suspended',
      daysInStage,
      healthScore,
      lastActivity,
      nextAction,
      riskFactors
    };
  }

  /**
   * Calcula o health score do tenant (0-100)
   */
  private async calculateHealthScore(tenant: any): Promise<number> {
    let score = 0;

    // 1. Atividade de usuários (40 pontos)
    const activeUsers = tenant.users.filter((user: any) => 
      user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    const totalUsers = tenant.users.length;
    const userActivityScore = totalUsers > 0 ? (activeUsers / totalUsers) * 40 : 0;
    score += userActivityScore;

    // 2. Uso de features (30 pontos)
    const featureUsageScore = await this.calculateFeatureUsageScore(tenant.id);
    score += featureUsageScore;

    // 3. Pagamentos em dia (20 pontos)
    const paymentScore = this.calculatePaymentScore(tenant);
    score += paymentScore;

    // 4. Suporte (10 pontos)
    const supportScore = this.calculateSupportScore(tenant);
    score += supportScore;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calcula score de uso de features
   */
  private async calculateFeatureUsageScore(tenantId: string): Promise<number> {
    try {
      const featureUsage = await prisma.usageTracking.findMany({
        where: { tenantId },
        select: { eventType: true, metadata: true }
      });

      if (featureUsage.length === 0) return 0;

      const recentUsage = featureUsage.filter(f => 
        true // Mock: assume all usage is recent
      );

      const totalUsage = recentUsage.reduce((sum, f) => sum + ((f.metadata as any)?.usageCount || 1), 0);
      const uniqueFeatures = new Set(recentUsage.map(f => f.eventType)).size;

      // Score baseado em uso total e diversidade de features
      const usageScore = Math.min(20, totalUsage / 10); // Máximo 20 pontos
      const diversityScore = Math.min(10, uniqueFeatures * 2); // Máximo 10 pontos

      return usageScore + diversityScore;
    } catch (error) {
      logger.error('Error calculating feature usage score:', error);
      return 0;
    }
  }

  /**
   * Calcula score de pagamentos
   */
  private calculatePaymentScore(tenant: any): number {
    if (!tenant.subscriptions || tenant.subscriptions.length === 0) return 0;

    const activeSubscription = tenant.subscriptions.find((sub: any) => sub.status === 'active');
    if (!activeSubscription) return 0;

    // Verificar se está em dia
    const now = new Date();
    const nextBilling = new Date(activeSubscription.nextBillingDate);
    
    if (nextBilling > now) return 20; // Em dia
    if (nextBilling > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) return 15; // 1 semana atrasado
    if (nextBilling > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)) return 10; // 1 mês atrasado
    return 0; // Muito atrasado
  }

  /**
   * Calcula score de suporte
   */
  private calculateSupportScore(tenant: any): number {
    // Verificar se há tickets de suporte recentes
    // Por enquanto, assumir que sem tickets = bom score
    return 10;
  }

  /**
   * Determina o estágio atual do tenant
   */
  private determineTenantStage(tenant: any, healthScore: number, daysSinceCreation: number): string {
    if (tenant.status === 'suspended') return 'suspended';
    if (tenant.status === 'inactive') return 'churned';

    // Trial period (primeiros 14 dias)
    if (daysSinceCreation <= 14 && tenant.plan === 'trial') {
      return 'trial';
    }

    // At risk (health score baixo)
    if (healthScore < 30) return 'at_risk';

    // Active (health score bom)
    return 'active';
  }

  /**
   * Calcula dias no estágio atual
   */
  private calculateDaysInStage(tenant: any, stage: string): number {
    const now = new Date();
    
    if (stage === 'trial') {
      const createdAt = new Date(tenant.createdAt);
      return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Para outros estágios, usar data de última atualização
    const updatedAt = new Date(tenant.updatedAt);
    return Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Identifica fatores de risco
   */
  private identifyRiskFactors(tenant: any, healthScore: number): string[] {
    const riskFactors: string[] = [];

    if (healthScore < 20) riskFactors.push('Very low health score');
    if (healthScore < 50) riskFactors.push('Low health score');

    // Verificar atividade de usuários
    const activeUsers = tenant.users.filter((user: any) => 
      user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    if (activeUsers === 0) riskFactors.push('No active users');
    if (activeUsers < tenant.users.length * 0.3) riskFactors.push('Low user activity');

    // Verificar pagamentos
    const activeSubscription = tenant.subscriptions?.find((sub: any) => sub.status === 'active');
    if (activeSubscription) {
      const nextBilling = new Date(activeSubscription.nextBillingDate);
      const now = new Date();
      
      if (nextBilling < now) riskFactors.push('Payment overdue');
      if (nextBilling < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) riskFactors.push('Payment due soon');
    }

    return riskFactors;
  }

  /**
   * Determina próxima ação recomendada
   */
  private determineNextAction(stage: string, riskFactors: string[], healthScore: number): string {
    switch (stage) {
      case 'trial':
        return 'Monitor trial progress and prepare onboarding';
      case 'active':
        if (healthScore < 70) return 'Check in with customer and offer support';
        return 'Continue monitoring and look for expansion opportunities';
      case 'at_risk':
        return 'Immediate intervention - contact customer and offer assistance';
      case 'churned':
        return 'Win-back campaign or archive';
      case 'suspended':
        return 'Review suspension reason and plan reactivation';
      default:
        return 'Monitor and analyze';
    }
  }

  /**
   * Obtém última atividade do tenant
   */
  private getLastActivity(tenant: any): Date {
    let lastActivity = new Date(tenant.updatedAt);

    // Verificar última atividade de usuários
    for (const user of tenant.users) {
      if (user.lastLogin && new Date(user.lastLogin) > lastActivity) {
        lastActivity = new Date(user.lastLogin);
      }
    }

    // Verificar última atividade de audit logs
    if (tenant.auditLogs && tenant.auditLogs.length > 0) {
      const latestLog = tenant.auditLogs.reduce((latest: any, log: any) => 
        new Date(log.createdAt) > new Date(latest.createdAt) ? log : latest
      );
      
      if (new Date(latestLog.createdAt) > lastActivity) {
        lastActivity = new Date(latestLog.createdAt);
      }
    }

    return lastActivity;
  }

  /**
   * Prediz churn de tenants
   */
  async predictChurn(): Promise<ChurnPrediction[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { status: 'active' },
        include: {
          users: true,
          subscriptions: true,
          auditLogs: true
        }
      });

      const predictions: ChurnPrediction[] = [];

      for (const tenant of tenants) {
        const prediction = await this.calculateChurnPrediction(tenant);
        predictions.push(prediction);
      }

      return predictions.sort((a, b) => b.churnProbability - a.churnProbability);
    } catch (error) {
      logger.error('Error predicting churn:', error);
      throw error;
    }
  }

  /**
   * Calcula predição de churn para um tenant
   */
  private async calculateChurnPrediction(tenant: any): Promise<ChurnPrediction> {
    const healthScore = await this.calculateHealthScore(tenant);
    const riskFactors = this.identifyRiskFactors(tenant, healthScore);
    
    // Calcular probabilidade de churn baseada no health score e fatores de risco
    let churnProbability = 0;
    
    // Base score baseado no health score
    churnProbability += (100 - healthScore) * 0.4;
    
    // Adicionar pontos por fatores de risco
    churnProbability += riskFactors.length * 10;
    
    // Adicionar pontos por inatividade
    const daysSinceLastActivity = this.getDaysSinceLastActivity(tenant);
    if (daysSinceLastActivity > 30) churnProbability += 20;
    if (daysSinceLastActivity > 60) churnProbability += 30;
    
    churnProbability = Math.min(100, churnProbability);
    
    // Determinar nível de risco
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (churnProbability < 25) riskLevel = 'low';
    else if (churnProbability < 50) riskLevel = 'medium';
    else if (churnProbability < 75) riskLevel = 'high';
    else riskLevel = 'critical';
    
    // Gerar ações recomendadas
    const recommendedActions = this.generateRecommendedActions(churnProbability, riskFactors);
    
    // Estimar dias até churn
    const daysToChurn = this.estimateDaysToChurn(churnProbability, daysSinceLastActivity);
    
    return {
      tenantId: tenant.id,
      churnProbability,
      riskLevel,
      riskFactors,
      recommendedActions,
      daysToChurn
    };
  }

  /**
   * Calcula dias desde última atividade
   */
  private getDaysSinceLastActivity(tenant: any): number {
    const lastActivity = this.getLastActivity(tenant);
    const now = new Date();
    return Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Gera ações recomendadas
   */
  private generateRecommendedActions(churnProbability: number, riskFactors: string[]): string[] {
    const actions: string[] = [];
    
    if (churnProbability > 70) {
      actions.push('Immediate phone call to customer');
      actions.push('Offer discount or free trial extension');
    }
    
    if (riskFactors.includes('No active users')) {
      actions.push('Send re-engagement email campaign');
      actions.push('Offer training session');
    }
    
    if (riskFactors.includes('Payment overdue')) {
      actions.push('Contact billing department');
      actions.push('Offer payment plan');
    }
    
    if (churnProbability > 50) {
      actions.push('Schedule check-in call');
      actions.push('Send usage report and tips');
    }
    
    return actions;
  }

  /**
   * Estima dias até churn
   */
  private estimateDaysToChurn(churnProbability: number, daysSinceLastActivity: number): number | undefined {
    if (churnProbability < 30) return undefined; // Muito baixo risco
    
    // Fórmula simples baseada na probabilidade e inatividade
    const baseDays = 90 - (churnProbability * 0.8);
    const activityPenalty = daysSinceLastActivity * 0.5;
    
    return Math.max(7, Math.floor(baseDays - activityPenalty));
  }

  /**
   * Identifica oportunidades de upgrade
   */
  async findUpgradeOpportunities(): Promise<any[]> {
    try {
      const tenants = await prisma.tenant.findMany({
        where: {
          status: 'active',
          plan: { in: ['starter', 'basic'] } // Planos que podem ser upgradeados
        },
        include: {
          users: true,
          auditLogs: true
        }
      });

      const opportunities: Array<{
        tenantId: string;
        tenantName: string;
        currentPlan: string;
        suggestedPlan: string;
        reasons: string[];
        confidence: number;
      }> = [];

      for (const tenant of tenants) {
        const healthScore = await this.calculateHealthScore(tenant);
        const userCount = 0; // Mock value for now
        const usageIntensity = await this.calculateUsageIntensity(tenant.id);

        // Critérios para upgrade
        if (healthScore > 70 && userCount > 5 && usageIntensity > 0.7) {
          opportunities.push({
            tenantId: tenant.id,
            tenantName: tenant.name,
            currentPlan: tenant.plan,
            suggestedPlan: this.suggestUpgradePlan(tenant.plan),
            reasons: [
              'High health score',
              'Growing user base',
              'High feature usage'
            ],
            confidence: this.calculateUpgradeConfidence(healthScore, userCount, usageIntensity)
          });
        }
      }

      return opportunities.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      logger.error('Error finding upgrade opportunities:', error);
      throw error;
    }
  }

  /**
   * Calcula intensidade de uso
   */
  private async calculateUsageIntensity(tenantId: string): Promise<number> {
    try {
      const usage = await prisma.auditLog.findMany({
        where: { tenantId },
        select: { action: true, changes: true }
      });

      if (usage.length === 0) return 0;

      const totalUsage = usage.length;
      const uniqueFeatures = new Set(usage.map(u => u.action)).size;

      // Normalizar baseado no número de features únicas e uso total
      return Math.min(1, (uniqueFeatures * 0.1) + (totalUsage / 1000));
    } catch (error) {
      logger.error('Error calculating usage intensity:', error);
      return 0;
    }
  }

  /**
   * Sugere plano de upgrade
   */
  private suggestUpgradePlan(currentPlan: string): string {
    const planHierarchy = ['trial', 'starter', 'basic', 'professional', 'enterprise'];
    const currentIndex = planHierarchy.indexOf(currentPlan);
    
    if (currentIndex < planHierarchy.length - 1) {
      return planHierarchy[currentIndex + 1];
    }
    
    return 'enterprise'; // Já no topo
  }

  /**
   * Calcula confiança na recomendação de upgrade
   */
  private calculateUpgradeConfidence(healthScore: number, userCount: number, usageIntensity: number): number {
    const healthWeight = 0.4;
    const userWeight = 0.3;
    const usageWeight = 0.3;

    return (healthScore * healthWeight) + 
           (Math.min(100, userCount * 10) * userWeight) + 
           (usageIntensity * 100 * usageWeight);
  }
}

export const tenantLifecycleService = new TenantLifecycleService();
