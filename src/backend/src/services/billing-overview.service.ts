/**
 * Billing Overview Service - FitOS
 * 
 * Service para overview de billing com cache Redis
 */

import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { 
  BillingOverview, 
  BillingIssue, 
  MRRARRData, 
  RevenueForecast, 
  PaymentMethodDistribution,
  SubscriptionLifecycle 
} from '../../../shared/types/billing-overview';

export class BillingOverviewService {
  private mockSubscriptions: any[] = [];
  private mockPayments: any[] = [];
  private mockIssues: BillingIssue[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock subscriptions
    const plans = ['basic', 'premium', 'enterprise'];
    for (let i = 0; i < 500; i++) {
      this.mockSubscriptions.push({
        id: `sub-${i}`,
        tenantId: `tenant-${Math.floor(Math.random() * 50)}`,
        tenantName: `Academia ${Math.floor(Math.random() * 50)}`,
        plan: plans[Math.floor(Math.random() * plans.length)],
        status: ['active', 'trial', 'cancelled', 'expired'][Math.floor(Math.random() * 4)],
        mrr: Math.floor(Math.random() * 1000) + 100,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    }

    // Mock payments
    for (let i = 0; i < 2000; i++) {
      this.mockPayments.push({
        id: `payment-${i}`,
        subscriptionId: `sub-${Math.floor(Math.random() * 500)}`,
        amount: Math.floor(Math.random() * 1000) + 100,
        currency: 'BRL',
        status: ['success', 'failed', 'pending'][Math.floor(Math.random() * 3)],
        method: ['stripe', 'mercadopago', 'pix'][Math.floor(Math.random() * 3)],
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      });
    }

    // Mock billing issues
    this.mockIssues = [
      {
        id: 'issue-1',
        tenantId: 'tenant-1',
        tenantName: 'Academia Central',
        type: 'failed_payment',
        amount: 299.90,
        currency: 'BRL',
        status: 'pending',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        lastAttempt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        attemptsCount: 3,
        paymentMethod: 'stripe'
      },
      {
        id: 'issue-2',
        tenantId: 'tenant-5',
        tenantName: 'Fit Studio',
        type: 'expired_card',
        amount: 199.90,
        currency: 'BRL',
        status: 'escalated',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        lastAttempt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        attemptsCount: 5,
        paymentMethod: 'mercadopago'
      }
    ];
  }

  async getBillingOverview(): Promise<BillingOverview> {
    const cacheKey = 'admin:billing:overview';
    const cached = await redisService.get<BillingOverview>(cacheKey);
    if (cached) {
      logger.info('Billing overview served from cache');
      return cached;
    }

    logger.info('Computing billing overview');
    const data = await this.computeBillingOverview();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_BILLING_OVERVIEW || '300')
    });
    
    return data;
  }

  async getMRRARR(): Promise<MRRARRData> {
    const cacheKey = 'admin:billing:mrr-arr';
    const cached = await redisService.get<MRRARRData>(cacheKey);
    if (cached) {
      logger.info('MRR/ARR data served from cache');
      return cached;
    }

    logger.info('Computing MRR/ARR data');
    const data = await this.computeMRRARR();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_BILLING_MRR_ARR || '3600')
    });
    
    return data;
  }

  async getBillingIssues(filters?: { status?: string; type?: string }): Promise<BillingIssue[]> {
    const cacheKey = `admin:billing:issues:${JSON.stringify(filters || {})}`;
    const cached = await redisService.get<BillingIssue[]>(cacheKey);
    if (cached) {
      logger.info('Billing issues served from cache');
      return cached;
    }

    logger.info('Computing billing issues');
    const data = await this.computeBillingIssues(filters);
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_BILLING_ISSUES || '60')
    });
    
    return data;
  }

  async getRevenueForecasting(): Promise<RevenueForecast[]> {
    const cacheKey = 'admin:billing:forecasting';
    const cached = await redisService.get<RevenueForecast[]>(cacheKey);
    if (cached) {
      logger.info('Revenue forecasting served from cache');
      return cached;
    }

    logger.info('Computing revenue forecasting');
    const data = await this.computeRevenueForecasting();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_BILLING_FORECASTING || '86400')
    });
    
    return data;
  }

  async getPaymentMethodsDistribution(): Promise<PaymentMethodDistribution[]> {
    const cacheKey = 'admin:billing:payment-methods';
    const cached = await redisService.get<PaymentMethodDistribution[]>(cacheKey);
    if (cached) {
      logger.info('Payment methods distribution served from cache');
      return cached;
    }

    logger.info('Computing payment methods distribution');
    const data = await this.computePaymentMethodsDistribution();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_BILLING_PAYMENT_METHODS || '3600')
    });
    
    return data;
  }

  async getSubscriptionLifecycle(): Promise<SubscriptionLifecycle> {
    const cacheKey = 'admin:billing:lifecycle';
    const cached = await redisService.get<SubscriptionLifecycle>(cacheKey);
    if (cached) {
      logger.info('Subscription lifecycle served from cache');
      return cached;
    }

    logger.info('Computing subscription lifecycle');
    const data = await this.computeSubscriptionLifecycle();
    
    await redisService.set(cacheKey, data, { 
      ttl: parseInt(process.env.CACHE_TTL_BILLING_MRR_ARR || '3600')
    });
    
    return data;
  }

  async invalidateBillingCache(): Promise<void> {
    logger.info('Invalidating billing cache');
    await redisService.invalidatePattern('admin:billing:*');
  }

  private async computeBillingOverview(): Promise<BillingOverview> {
    const activeSubscriptions = this.mockSubscriptions.filter(s => s.status === 'active');
    const totalMRR = activeSubscriptions.reduce((sum, s) => sum + s.mrr, 0);
    const arr = totalMRR * 12;
    
    const successfulPayments = this.mockPayments.filter(p => p.status === 'success').length;
    const totalPayments = this.mockPayments.length;
    const paymentSuccessRate = totalPayments > 0 ? successfulPayments / totalPayments : 0;

    const totalRevenue = this.mockPayments
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + p.amount, 0);

    // Mock growth and churn rates
    const growthRate = Math.random() * 0.2; // 0-20%
    const churnRate = Math.random() * 0.05; // 0-5%

    return {
      mrr: totalMRR,
      arr,
      growthRate,
      churnRate,
      activeSubscriptions: activeSubscriptions.length,
      paymentSuccessRate,
      totalRevenue,
      fromCache: false,
      cachedAt: new Date()
    };
  }

  private async computeMRRARR(): Promise<MRRARRData> {
    const activeSubscriptions = this.mockSubscriptions.filter(s => s.status === 'active');
    const totalMRR = activeSubscriptions.reduce((sum, s) => sum + s.mrr, 0);
    const arr = totalMRR * 12;

    const newMRR = Math.random() * totalMRR * 0.1; // 10% growth
    const churnedMRR = Math.random() * totalMRR * 0.05; // 5% churn
    const expansionMRR = Math.random() * totalMRR * 0.03; // 3% expansion
    const contractionMRR = Math.random() * totalMRR * 0.02; // 2% contraction

    const byPlan = ['basic', 'premium', 'enterprise'].map(plan => {
      const planSubs = activeSubscriptions.filter(s => s.plan === plan);
      return {
        plan,
        mrr: planSubs.reduce((sum, s) => sum + s.mrr, 0),
        tenantCount: planSubs.length
      };
    });

    return {
      mrr: totalMRR,
      arr,
      mrrGrowth: (newMRR - churnedMRR) / totalMRR,
      arrGrowth: ((newMRR - churnedMRR) * 12) / arr,
      newMRR,
      churnedMRR,
      expansionMRR,
      contractionMRR,
      byPlan
    };
  }

  private async computeBillingIssues(filters?: { status?: string; type?: string }): Promise<BillingIssue[]> {
    let issues = [...this.mockIssues];

    if (filters?.status) {
      issues = issues.filter(issue => issue.status === filters.status);
    }

    if (filters?.type) {
      issues = issues.filter(issue => issue.type === filters.type);
    }

    return issues;
  }

  private async computeRevenueForecasting(): Promise<RevenueForecast[]> {
    const currentMRR = this.mockSubscriptions
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + s.mrr, 0);

    const forecasts: RevenueForecast[] = [];
    const now = new Date();

    for (let month = 1; month <= 12; month++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + month, 1);
      const monthStr = forecastDate.toISOString().substring(0, 7);

      const growthFactor = 1 + (Math.random() * 0.1 - 0.05); // ±5% variation
      const baseRevenue = currentMRR * Math.pow(1.05, month); // 5% monthly growth

      forecasts.push({
        month: monthStr,
        pessimistic: baseRevenue * 0.9,
        realistic: baseRevenue * growthFactor,
        optimistic: baseRevenue * 1.2
      });
    }

    return forecasts;
  }

  private async computePaymentMethodsDistribution(): Promise<PaymentMethodDistribution[]> {
    const methods = ['stripe', 'mercadopago', 'pix'];
    const totalPayments = this.mockPayments.length;

    return methods.map(method => {
      const methodPayments = this.mockPayments.filter(p => p.method === method);
      const successfulPayments = methodPayments.filter(p => p.status === 'success');
      
      return {
        method,
        count: methodPayments.length,
        percentage: methodPayments.length / totalPayments,
        successRate: methodPayments.length > 0 ? successfulPayments.length / methodPayments.length : 0,
        avgAmount: methodPayments.length > 0 ? 
          methodPayments.reduce((sum, p) => sum + p.amount, 0) / methodPayments.length : 0
      };
    });
  }

  private async computeSubscriptionLifecycle(): Promise<SubscriptionLifecycle> {
    const newCount = this.mockSubscriptions.filter(s => {
      const createdAt = new Date(s.createdAt);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return createdAt > thirtyDaysAgo;
    }).length;

    const activeCount = this.mockSubscriptions.filter(s => s.status === 'active').length;
    const trialCount = this.mockSubscriptions.filter(s => s.status === 'trial').length;
    const cancelledCount = this.mockSubscriptions.filter(s => s.status === 'cancelled').length;
    const expiredCount = this.mockSubscriptions.filter(s => s.status === 'expired').length;

    return {
      new: newCount,
      active: activeCount,
      trial: trialCount,
      cancelled: cancelledCount,
      expired: expiredCount,
      total: this.mockSubscriptions.length
    };
  }
}

export const billingOverviewService = new BillingOverviewService();

