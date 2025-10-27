/**
 * User Analytics Types - FitOS
 * 
 * Tipos para análise de usuários
 */

export interface UserAnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  retentionRate: number;
  engagementScore: number;
  lastUpdated: Date;
}

export interface UserEngagementMetrics {
  dau: number; // Daily Active Users
  wau: number; // Weekly Active Users
  mau: number; // Monthly Active Users
  avgSessionTime: number;
  avgActionsPerSession: number;
  bounceRate: number;
  fromCache?: boolean;
  cachedAt?: Date;
}

export interface UserRetentionData {
  cohort: string;
  users: number;
  retention: number[];
}

export interface UserBehaviorPattern {
  userId: string;
  pattern: string;
  frequency: number;
  lastSeen: Date;
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
  userCount: number;
  createdAt: Date;
}

export interface RetentionCohort {
  cohortDate: string;
  users: number;
  retention: number[];
  period: number;
}

export interface FeatureAdoption {
  feature: string;
  totalUsers: number;
  adoptedUsers: number;
  adoptionRate: number;
  trend: 'up' | 'down';
}

export interface SessionAnalytics {
  totalSessions: number;
  avgSessionDuration: number;
  sessionsByDevice: Record<string, number>;
  sessionsByHour: Array<{ hour: number; count: number }>;
  topPages: Array<{ page: string; views: number; uniqueViews: number }>;
}

export interface UserJourneyFunnel {
  stages: Array<{
    stage: string;
    users: number;
    conversionRate: number;
    dropOffRate: number;
  }>;
  totalConversionRate: number;
  avgTimeToConvert: number;
}

export interface TopActiveUser {
  id: string;
  name: string;
  email: string;
  lastActive: Date;
  sessionCount: number;
  totalTime: number;
  actionsCount: number;
}