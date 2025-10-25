import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface UserEngagementData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  engagementScore: number;
  lastLogin: Date | null;
  sessionCount: number;
  avgSessionDuration: number;
  featuresUsed: string[];
  activityLevel: 'low' | 'medium' | 'high' | 'very_high';
  riskLevel: 'low' | 'medium' | 'high';
  recommendedActions: string[];
}

export interface EngagementMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  avgEngagementScore: number;
  highEngagementUsers: number;
  lowEngagementUsers: number;
  churnRiskUsers: number;
}

export interface FeatureUsageStats {
  featureName: string;
  totalUsage: number;
  uniqueUsers: number;
  avgUsagePerUser: number;
  adoptionRate: number;
  trend: 'up' | 'down' | 'stable';
}

export class UserEngagementService {
  /**
   * Calcula engajamento de todos os usuários
   */
  async calculateAllUserEngagement(): Promise<UserEngagementData[]> {
    try {
      const users = await prisma.user.findMany({
        include: {
          tenant: true,
          auditLogs: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
              }
            }
          }
        }
      });

      const engagementData: UserEngagementData[] = [];

      for (const user of users) {
        const data = await this.calculateUserEngagement(user);
        engagementData.push(data);
      }

      return engagementData.sort((a, b) => b.engagementScore - a.engagementScore);
    } catch (error) {
      logger.error('Error calculating user engagement:', error);
      throw error;
    }
  }

  /**
   * Calcula engajamento de um usuário específico
   */
  async calculateUserEngagement(user: any): Promise<UserEngagementData> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calcular score de engajamento
    const engagementScore = await this.calculateEngagementScore(user);

    // Contar sessões (baseado em logins)
    const sessionCount = await this.countUserSessions(user.id, thirtyDaysAgo);

    // Calcular duração média das sessões
    const avgSessionDuration = await this.calculateAvgSessionDuration(user.id, thirtyDaysAgo);

    // Features usadas
    const featuresUsed = await this.getUserFeaturesUsed(user.id, thirtyDaysAgo);

    // Determinar nível de atividade
    const activityLevel = this.determineActivityLevel(engagementScore, sessionCount);

    // Determinar nível de risco
    const riskLevel = this.determineRiskLevel(engagementScore, user.lastLogin, featuresUsed.length);

    // Gerar ações recomendadas
    const recommendedActions = this.generateRecommendedActions(engagementScore, riskLevel, featuresUsed);

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName || 'N/A',
      lastName: user.lastName || 'N/A',
      role: user.role || 'CLIENT',
      tenantId: user.tenantId || 'default-tenant',
      engagementScore,
      lastLogin: user.lastLogin,
      sessionCount,
      avgSessionDuration,
      featuresUsed,
      activityLevel,
      riskLevel,
      recommendedActions
    };
  }

  /**
   * Calcula score de engajamento (0-100)
   */
  private async calculateEngagementScore(user: any): Promise<number> {
    let score = 0;

    // 1. Frequência de login (40 pontos)
    const loginScore = this.calculateLoginScore(user.lastLogin);
    score += loginScore;

    // 2. Atividade recente (30 pontos)
    const activityScore = await this.calculateActivityScore(user.id);
    score += activityScore;

    // 3. Diversidade de features (20 pontos)
    const featureDiversityScore = await this.calculateFeatureDiversityScore(user.id);
    score += featureDiversityScore;

    // 4. Duração das sessões (10 pontos)
    const sessionScore = await this.calculateSessionScore(user.id);
    score += sessionScore;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calcula score baseado em login
   */
  private calculateLoginScore(lastLogin: Date | null): number {
    if (!lastLogin) return 0;

    const now = new Date();
    const daysSinceLogin = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceLogin <= 1) return 40;
    if (daysSinceLogin <= 3) return 35;
    if (daysSinceLogin <= 7) return 30;
    if (daysSinceLogin <= 14) return 20;
    if (daysSinceLogin <= 30) return 10;
    return 0;
  }

  /**
   * Calcula score de atividade
   */
  private async calculateActivityScore(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const activityCount = await prisma.auditLog.count({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // Normalizar baseado no número de atividades
      if (activityCount === 0) return 0;
      if (activityCount < 5) return 10;
      if (activityCount < 20) return 20;
      if (activityCount < 50) return 25;
      return 30;
    } catch (error) {
      logger.error('Error calculating activity score:', error);
      return 0;
    }
  }

  /**
   * Calcula score de diversidade de features
   */
  private async calculateFeatureDiversityScore(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const auditLog = await prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        },
        select: { action: true }
      });

      const uniqueFeatures = new Set(auditLog.map(f => f.action)).size;

      // Score baseado no número de features únicas usadas
      if (uniqueFeatures === 0) return 0;
      if (uniqueFeatures < 3) return 5;
      if (uniqueFeatures < 5) return 10;
      if (uniqueFeatures < 8) return 15;
      return 20;
    } catch (error) {
      logger.error('Error calculating feature diversity score:', error);
      return 0;
    }
  }

  /**
   * Calcula score de sessões
   */
  private async calculateSessionScore(userId: string): Promise<number> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const avgDuration = await this.calculateAvgSessionDuration(userId, thirtyDaysAgo);

      // Score baseado na duração média das sessões (em minutos)
      if (avgDuration < 5) return 0;
      if (avgDuration < 15) return 3;
      if (avgDuration < 30) return 6;
      if (avgDuration < 60) return 8;
      return 10;
    } catch (error) {
      logger.error('Error calculating session score:', error);
      return 0;
    }
  }

  /**
   * Conta sessões do usuário
   */
  private async countUserSessions(userId: string, since: Date): Promise<number> {
    try {
      // Contar logins únicos por dia
      const loginLogs = await prisma.auditLog.findMany({
        where: {
          userId,
          action: 'login',
          createdAt: { gte: since }
        },
        select: { createdAt: true }
      });

      // Agrupar por dia
      const loginDays = new Set(
        loginLogs.map(log => log.createdAt.toISOString().split('T')[0])
      );

      return loginDays.size;
    } catch (error) {
      logger.error('Error counting user sessions:', error);
      return 0;
    }
  }

  /**
   * Calcula duração média das sessões
   */
  private async calculateAvgSessionDuration(userId: string, since: Date): Promise<number> {
    try {
      // Buscar logs de login e logout
      const sessionLogs = await prisma.auditLog.findMany({
        where: {
          userId,
          action: { in: ['login', 'logout'] },
          createdAt: { gte: since }
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

      return sessionCount > 0 ? totalDuration / sessionCount : 0;
    } catch (error) {
      logger.error('Error calculating avg session duration:', error);
      return 0;
    }
  }

  /**
   * Obtém features usadas pelo usuário
   */
  private async getUserFeaturesUsed(userId: string, since: Date): Promise<string[]> {
    try {
      const auditLog = await prisma.auditLog.findMany({
        where: {
          userId,
          createdAt: { gte: since }
        },
        select: { action: true },
        distinct: ['action']
      });

      return auditLog.map(f => f.action);
    } catch (error) {
      logger.error('Error getting user features used:', error);
      return [];
    }
  }

  /**
   * Determina nível de atividade
   */
  private determineActivityLevel(engagementScore: number, sessionCount: number): 'low' | 'medium' | 'high' | 'very_high' {
    if (engagementScore >= 80 && sessionCount >= 10) return 'very_high';
    if (engagementScore >= 60 && sessionCount >= 5) return 'high';
    if (engagementScore >= 40 && sessionCount >= 2) return 'medium';
    return 'low';
  }

  /**
   * Determina nível de risco
   */
  private determineRiskLevel(engagementScore: number, lastLogin: Date | null, featuresUsed: number): 'low' | 'medium' | 'high' {
    if (!lastLogin) return 'high';

    const daysSinceLogin = Math.floor((Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

    if (engagementScore < 30 || daysSinceLogin > 30) return 'high';
    if (engagementScore < 60 || daysSinceLogin > 14 || featuresUsed < 2) return 'medium';
    return 'low';
  }

  /**
   * Gera ações recomendadas
   */
  private generateRecommendedActions(engagementScore: number, riskLevel: string, featuresUsed: string[]): string[] {
    const actions: string[] = [];

    if (riskLevel === 'high') {
      actions.push('Send re-engagement email');
      actions.push('Schedule check-in call');
      actions.push('Offer training session');
    }

    if (engagementScore < 50) {
      actions.push('Send feature highlights email');
      actions.push('Invite to webinar');
    }

    if (featuresUsed.length < 3) {
      actions.push('Send feature discovery email');
      actions.push('Schedule product demo');
    }

    if (engagementScore < 30) {
      actions.push('Escalate to customer success');
      actions.push('Offer account review call');
    }

    return actions;
  }

  /**
   * Obtém métricas gerais de engajamento
   */
  async getEngagementMetrics(): Promise<EngagementMetrics> {
    try {
      const allUsers = await prisma.user.findMany({
        include: {
          auditLogs: {
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }
        }
      });

      const totalUsers = allUsers.length;
      let activeUsers = 0;
      let highEngagementUsers = 0;
      let lowEngagementUsers = 0;
      let churnRiskUsers = 0;
      let totalEngagementScore = 0;

      for (const user of allUsers) {
        const engagementData = await this.calculateUserEngagement(user);
        
        totalEngagementScore += engagementData.engagementScore;

        if (engagementData.lastLogin && 
            new Date(engagementData.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
          activeUsers++;
        }

        if (engagementData.activityLevel === 'very_high' || engagementData.activityLevel === 'high') {
          highEngagementUsers++;
        }

        if (engagementData.activityLevel === 'low') {
          lowEngagementUsers++;
        }

        if (engagementData.riskLevel === 'high') {
          churnRiskUsers++;
        }
      }

      const inactiveUsers = totalUsers - activeUsers;
      const avgEngagementScore = totalUsers > 0 ? totalEngagementScore / totalUsers : 0;

      return {
        totalUsers,
        activeUsers,
        inactiveUsers,
        avgEngagementScore,
        highEngagementUsers,
        lowEngagementUsers,
        churnRiskUsers
      };
    } catch (error) {
      logger.error('Error getting engagement metrics:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de uso de features
   */
  async getFeatureUsageStats(): Promise<FeatureUsageStats[]> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      // Buscar uso de features nos últimos 30 dias
      const currentUsage = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        },
        select: {
          action: true,
          userId: true
        }
      });

      // Buscar uso de features nos 30 dias anteriores para calcular tendência
      const previousUsage = await prisma.auditLog.findMany({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        },
        select: {
          action: true
        }
      });

      // Agrupar por feature
      const featureStats: { [key: string]: FeatureUsageStats } = {};

      for (const usage of currentUsage) {
        if (!featureStats[usage.action]) {
          featureStats[usage.action] = {
            featureName: usage.action,
            totalUsage: 0,
            uniqueUsers: 0,
            avgUsagePerUser: 0,
            adoptionRate: 0,
            trend: 'stable'
          };
        }

        featureStats[usage.action].totalUsage += 1;
        featureStats[usage.action].uniqueUsers++;
      }

      // Calcular métricas
      const totalUsers = await prisma.user.count();
      
      for (const featureName in featureStats) {
        const stats = featureStats[featureName];
        stats.avgUsagePerUser = stats.uniqueUsers > 0 ? stats.totalUsage / stats.uniqueUsers : 0;
        stats.adoptionRate = totalUsers > 0 ? (stats.uniqueUsers / totalUsers) * 100 : 0;

        // Calcular tendência
        const previousTotal = previousUsage
          .filter(u => u.action === featureName)
          .reduce((sum, u) => sum + 1, 0);

        const currentTotal = stats.totalUsage;
        
        if (currentTotal > previousTotal * 1.1) stats.trend = 'up';
        else if (currentTotal < previousTotal * 0.9) stats.trend = 'down';
        else stats.trend = 'stable';
      }

      return Object.values(featureStats).sort((a, b) => b.totalUsage - a.totalUsage);
    } catch (error) {
      logger.error('Error getting feature usage stats:', error);
      throw error;
    }
  }

  /**
   * Identifica usuários inativos
   */
  async getInactiveUsers(days: number = 30): Promise<UserEngagementData[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const inactiveUsers = await prisma.user.findMany({
        where: {
          OR: [
            { lastLogin: { lt: cutoffDate } },
            { lastLogin: null }
          ]
        },
        include: {
          tenant: true,
          auditLogs: {
            where: {
              createdAt: { gte: cutoffDate }
            }
          }
        }
      });

      const inactiveEngagementData: UserEngagementData[] = [];

      for (const user of inactiveUsers) {
        const data = await this.calculateUserEngagement(user);
        inactiveEngagementData.push(data);
      }

      return inactiveEngagementData.sort((a, b) => 
        new Date(a.lastLogin || 0).getTime() - new Date(b.lastLogin || 0).getTime()
      );
    } catch (error) {
      logger.error('Error getting inactive users:', error);
      throw error;
    }
  }

  /**
   * Identifica power users
   */
  async getPowerUsers(): Promise<UserEngagementData[]> {
    try {
      const allUsers = await this.calculateAllUserEngagement();
      
      return allUsers
        .filter(user => 
          user.activityLevel === 'very_high' && 
          user.engagementScore >= 80
        )
        .slice(0, 50); // Top 50 power users
    } catch (error) {
      logger.error('Error getting power users:', error);
      throw error;
    }
  }

  /**
   * Rastreia uso de feature
   */
  async trackFeatureUsage(userId: string, featureName: string): Promise<void> {
    try {
      const existing = await prisma.auditLog.findFirst({
        where: {
          userId,
          action: featureName
        }
      });

      if (existing) {
        await prisma.auditLog.update({
          where: { id: existing.id },
          data: {
            changes: { usageCount: (existing.changes as any)?.usageCount + 1 || 1, lastUsed: new Date() }
          }
        });
      } else {
        await prisma.auditLog.create({
          data: {
            userId,
            action: featureName,
            changes: { usageCount: 1, lastUsed: new Date() },
            tenantId: 'default-tenant', // Assumir tenant padrão por enquanto
            entityType: 'FeatureUsage',
            entityId: 'default'
          }
        });
      }
    } catch (error) {
      logger.error('Error tracking feature usage:', error);
      throw error;
    }
  }
}

export const userEngagementService = new UserEngagementService();
