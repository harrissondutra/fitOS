/**
 * Admin Cache Warming Service - FitOS
 * 
 * Service para pre-aquecer caches críticos do admin dashboard
 */

import { systemHealthService } from './system-health.service';
import { userAnalyticsService } from './user-analytics.service';
import { billingOverviewService } from './billing-overview.service';
import { logger } from '../utils/logger';

export class AdminCacheWarmingService {
  private isWarming = false;

  async warmSystemHealth(): Promise<void> {
    try {
      logger.info('Warming system health cache...');
      
      await Promise.all([
        systemHealthService.getSystemHealthOverview(),
        systemHealthService.getServicesStatus(),
        systemHealthService.getSystemMetrics('24h'),
        systemHealthService.getActiveAlerts(),
        systemHealthService.getPerformanceHistory('24h')
      ]);
      
      logger.info('System health cache warmed successfully');
    } catch (error) {
      logger.error('Error warming system health cache:', error);
    }
  }

  async warmUserAnalytics(): Promise<void> {
    try {
      logger.info('Warming user analytics cache...');
      
      // Pre-carregar cohorts populares
      const periods = [7, 30, 90];
      const cohortPromises = periods.map(days => {
        const endDate = new Date();
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return userAnalyticsService.getRetentionCohorts(startDate, endDate);
      });

      await Promise.all([
        userAnalyticsService.getUserEngagementOverview(),
        userAnalyticsService.getFeatureAdoption(),
        userAnalyticsService.getSessionAnalytics(),
        userAnalyticsService.getUserJourneyFunnel(),
        userAnalyticsService.getTopActiveUsers(10),
        ...cohortPromises
      ]);
      
      logger.info('User analytics cache warmed successfully');
    } catch (error) {
      logger.error('Error warming user analytics cache:', error);
    }
  }

  async warmBilling(): Promise<void> {
    try {
      logger.info('Warming billing cache...');
      
      await Promise.all([
        billingOverviewService.getBillingOverview(),
        billingOverviewService.getMRRARR(),
        billingOverviewService.getBillingIssues(),
        billingOverviewService.getRevenueForecasting(),
        billingOverviewService.getPaymentMethodsDistribution(),
        billingOverviewService.getSubscriptionLifecycle()
      ]);
      
      logger.info('Billing cache warmed successfully');
    } catch (error) {
      logger.error('Error warming billing cache:', error);
    }
  }

  async warmAll(): Promise<void> {
    if (this.isWarming) {
      logger.info('Cache warming already in progress, skipping...');
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      logger.info('Starting comprehensive cache warming...');
      
      await Promise.all([
        this.warmSystemHealth(),
        this.warmUserAnalytics(),
        this.warmBilling()
      ]);

      const duration = Date.now() - startTime;
      logger.info(`Cache warming completed successfully in ${duration}ms`);
    } catch (error) {
      logger.error('Error during cache warming:', error);
    } finally {
      this.isWarming = false;
    }
  }

  async warmCritical(): Promise<void> {
    try {
      logger.info('Warming critical cache only...');
      
      // Apenas os caches mais críticos com TTL baixo
      await Promise.all([
        systemHealthService.getSystemHealthOverview(),
        systemHealthService.getActiveAlerts(),
        billingOverviewService.getBillingIssues(),
        userAnalyticsService.getUserEngagementOverview()
      ]);
      
      logger.info('Critical cache warmed successfully');
    } catch (error) {
      logger.error('Error warming critical cache:', error);
    }
  }

  isCurrentlyWarming(): boolean {
    return this.isWarming;
  }
}

export const adminCacheWarmingService = new AdminCacheWarmingService();

