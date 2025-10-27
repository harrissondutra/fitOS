/**
 * User Analytics Service - FitOS
 * 
 * Service para analytics de usuários com cache Redis
 */

import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { 
  UserEngagementMetrics, 
  RetentionCohort, 
  FeatureAdoption, 
  SessionAnalytics, 
  UserJourneyFunnel,
  TopActiveUser 
} from '../../../shared/types/user-analytics';

export class UserAnalyticsService {
  private mockUsers: any[] = [];
  private mockSessions: any[] = [];
  private mockFeatures: string[] = ['workouts', 'nutrition', 'assessments', 'crm', 'marketplace'];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock users
    for (let i = 0; i < 1000; i++) {
      this.mockUsers.push({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        tenantId: `tenant-${Math.floor(Math.random() * 10)}`
      });
    }

    // Mock sessions
    for (let i = 0; i < 5000; i++) {
      this.mockSessions.push({
        id: `session-${i}`,
        userId: `user-${Math.floor(Math.random() * 1000)}`,
        startTime: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        duration: Math.floor(Math.random() * 3600), // segundos
        actions: Math.floor(Math.random() * 50),
        device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
        page: ['dashboard', 'workouts', 'nutrition', 'assessments'][Math.floor(Math.random() * 4)]
      });
    }
  }

  async getUserEngagementOverview(): Promise<UserEngagementMetrics> {
    const cacheKey = 'admin:user-analytics:overview';
    const cached = await redisService.get<UserEngagementMetrics>(cacheKey);
    if (cached) {
      logger.info('User engagement overview served from cache');
      return cached;
    }

    logger.info('Computing user engagement overview');
    const data = await this.computeEngagementOverview();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_USER_ANALYTICS_OVERVIEW || '300')
    });
    
    return data;
  }

  async getEngagementMetrics(date: Date): Promise<UserEngagementMetrics> {
    const cacheKey = `admin:user-analytics:engagement:${date.toISOString().split('T')[0]}`;
    const cached = await redisService.get<UserEngagementMetrics>(cacheKey);
    if (cached) {
      logger.info(`Engagement metrics for ${date.toISOString().split('T')[0]} served from cache`);
      return cached;
    }

    logger.info(`Computing engagement metrics for ${date.toISOString().split('T')[0]}`);
    const data = await this.computeEngagementForDate(date);
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_USER_ANALYTICS_ENGAGEMENT || '3600')
    });
    
    return data;
  }

  async getRetentionCohorts(startDate: Date, endDate: Date): Promise<RetentionCohort[]> {
    const cacheKey = `admin:user-analytics:retention:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await redisService.get<RetentionCohort[]>(cacheKey);
    if (cached) {
      logger.info('Retention cohorts served from cache');
      return cached;
    }

    logger.info('Computing retention cohorts');
    const data = await this.calculateRetentionCohorts(startDate, endDate);
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_USER_ANALYTICS_RETENTION || '86400')
    });
    
    return data;
  }

  async getFeatureAdoption(): Promise<FeatureAdoption[]> {
    const cacheKey = 'admin:user-analytics:features';
    const cached = await redisService.get<FeatureAdoption[]>(cacheKey);
    if (cached) {
      logger.info('Feature adoption served from cache');
      return cached;
    }

    logger.info('Computing feature adoption');
    const data = await this.computeFeatureAdoption();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_USER_ANALYTICS_FEATURES || '1800')
    });
    
    return data;
  }

  async getSessionAnalytics(): Promise<SessionAnalytics> {
    const cacheKey = 'admin:user-analytics:sessions';
    const cached = await redisService.get<SessionAnalytics>(cacheKey);
    if (cached) {
      logger.info('Session analytics served from cache');
      return cached;
    }

    logger.info('Computing session analytics');
    const data = await this.computeSessionAnalytics();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_USER_ANALYTICS_SESSIONS || '300')
    });
    
    return data;
  }

  async getUserJourneyFunnel(): Promise<UserJourneyFunnel> {
    const cacheKey = 'admin:user-analytics:journey';
    const cached = await redisService.get<UserJourneyFunnel>(cacheKey);
    if (cached) {
      logger.info('User journey funnel served from cache');
      return cached;
    }

    logger.info('Computing user journey funnel');
    const data = await this.computeUserJourneyFunnel();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_USER_ANALYTICS_RETENTION || '3600')
    });
    
    return data;
  }

  async getTopActiveUsers(limit: number = 10): Promise<TopActiveUser[]> {
    const cacheKey = `admin:user-analytics:top-users:${limit}`;
    const cached = await redisService.get<TopActiveUser[]>(cacheKey);
    if (cached) {
      logger.info(`Top ${limit} active users served from cache`);
      return cached;
    }

    logger.info(`Computing top ${limit} active users`);
    const data = await this.computeTopActiveUsers(limit);
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_USER_ANALYTICS_SESSIONS || '300')
    });
    
    return data;
  }

  private async computeEngagementOverview(): Promise<UserEngagementMetrics> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dau = this.mockUsers.filter(u => u.lastActive > oneDayAgo).length;
    const wau = this.mockUsers.filter(u => u.lastActive > oneWeekAgo).length;
    const mau = this.mockUsers.filter(u => u.lastActive > oneMonthAgo).length;

    const avgSessionTime = this.mockSessions.reduce((sum, s) => sum + s.duration, 0) / this.mockSessions.length;
    const avgActionsPerSession = this.mockSessions.reduce((sum, s) => sum + s.actions, 0) / this.mockSessions.length;
    const bounceRate = Math.random() * 0.3; // 0-30%

    return {
      dau,
      wau,
      mau,
      avgSessionTime,
      avgActionsPerSession,
      bounceRate,
      fromCache: false,
      cachedAt: new Date()
    };
  }

  private async computeEngagementForDate(date: Date): Promise<UserEngagementMetrics> {
    // Simplified version for specific date
    return await this.computeEngagementOverview();
  }

  private async calculateRetentionCohorts(startDate: Date, endDate: Date): Promise<RetentionCohort[]> {
    const cohorts: RetentionCohort[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const cohortUsers = this.mockUsers.filter(u => 
        u.createdAt >= currentDate && u.createdAt < new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
      );
      
      const retention = [];
      for (let day = 1; day <= 30; day++) {
        const checkDate = new Date(currentDate.getTime() + day * 24 * 60 * 60 * 1000);
        const activeUsers = cohortUsers.filter(u => u.lastActive >= checkDate).length;
        retention.push(cohortUsers.length > 0 ? Number(activeUsers) / Number(cohortUsers.length) : 0);
      }

      cohorts.push({
        cohortDate: currentDate.toISOString().split('T')[0],
        users: cohortUsers.length,
        retention,
        period: 30
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return cohorts;
  }

  private async computeFeatureAdoption(): Promise<FeatureAdoption[]> {
    return this.mockFeatures.map(feature => {
      const totalUsers = this.mockUsers.length;
      const adoptedUsers = Math.floor(Math.random() * totalUsers * 0.8);
      const adoptionRate = adoptedUsers / totalUsers;
      
      return {
        feature,
        totalUsers,
        adoptedUsers,
        adoptionRate,
        trend: Math.random() > 0.5 ? 'up' : 'down'
      };
    });
  }

  private async computeSessionAnalytics(): Promise<SessionAnalytics> {
    const totalSessions = this.mockSessions.length;
    const avgSessionDuration = this.mockSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions;
    
    const sessionsByDevice = this.mockSessions.reduce((acc, s) => {
      acc[s.device] = (acc[s.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sessionsByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: Math.floor(Math.random() * 100)
    }));

    const topPages = this.mockSessions.reduce((acc, s) => {
      const existing = acc.find(p => p.page === s.page);
      if (existing) {
        existing.views++;
        existing.uniqueViews++;
      } else {
        acc.push({ page: s.page, views: 1, uniqueViews: 1 });
      }
      return acc;
    }, [] as Array<{ page: string; views: number; uniqueViews: number }>);

    return {
      totalSessions,
      avgSessionDuration,
      sessionsByDevice,
      sessionsByHour,
      topPages: topPages.sort((a, b) => b.views - a.views).slice(0, 10)
    };
  }

  private async computeUserJourneyFunnel(): Promise<UserJourneyFunnel> {
    const stages = [
      { stage: 'Signup', users: 1000, conversionRate: 1.0, dropOffRate: 0 },
      { stage: 'Onboarding', users: 800, conversionRate: 0.8, dropOffRate: 0.2 },
      { stage: 'First Workout', users: 600, conversionRate: 0.6, dropOffRate: 0.25 },
      { stage: 'Active User', users: 400, conversionRate: 0.4, dropOffRate: 0.33 }
    ];

    return {
      stages,
      totalConversionRate: 0.4,
      avgTimeToConvert: 7.5 // dias
    };
  }

  private async computeTopActiveUsers(limit: number): Promise<TopActiveUser[]> {
    const userStats = this.mockUsers.map(user => {
      const userSessions = this.mockSessions.filter(s => s.userId === user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        lastActive: user.lastActive,
        sessionCount: userSessions.length,
        totalTime: userSessions.reduce((sum, s) => sum + s.duration, 0),
        actionsCount: userSessions.reduce((sum, s) => sum + s.actions, 0)
      };
    });

    return userStats
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, limit);
  }
}

export const userAnalyticsService = new UserAnalyticsService();
