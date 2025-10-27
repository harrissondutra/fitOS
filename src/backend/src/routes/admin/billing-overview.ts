/**
 * Billing Overview Routes - FitOS
 * 
 * Rotas para overview de billing
 */

import { Router } from 'express';
import { billingOverviewService } from '../../services/billing-overview.service';
import { logger } from '../../utils/logger';

const router = Router();

// Middleware para adicionar cache headers
const addCacheHeaders = (res: any, fromCache: boolean, cachedAt?: Date) => {
  res.set('X-Cache-Status', fromCache ? 'HIT' : 'MISS');
  if (cachedAt) {
    res.set('X-Cache-Date', cachedAt.toISOString());
  }
};

/**
 * GET /api/admin/billing/overview
 * Overview de billing (cached 5min)
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await billingOverviewService.getBillingOverview();
    
    addCacheHeaders(res, overview.fromCache || false, overview.cachedAt);
    
    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching billing overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing overview',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/billing/mrr-arr
 * MRR e ARR detalhados (cached 1h)
 */
router.get('/mrr-arr', async (req, res) => {
  try {
    const mrrArr = await billingOverviewService.getMRRARR();
    
    res.json({
      success: true,
      data: mrrArr,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching MRR/ARR data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch MRR/ARR data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/billing/issues
 * Issues de billing (cached 1min)
 * Query params: status, type
 */
router.get('/issues', async (req, res) => {
  try {
    const { status, type } = req.query;
    
    const filters: { status?: string; type?: string } = {};
    if (status) filters.status = status as string;
    if (type) filters.type = type as string;

    const issues = await billingOverviewService.getBillingIssues(filters);
    
    res.json({
      success: true,
      data: issues,
      filters,
      count: issues.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching billing issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing issues',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/billing/forecasting
 * Previsões de receita (cached 24h)
 */
router.get('/forecasting', async (req, res) => {
  try {
    const forecasting = await billingOverviewService.getRevenueForecasting();
    
    res.json({
      success: true,
      data: forecasting,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching revenue forecasting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue forecasting',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/billing/payment-methods
 * Distribuição de métodos de pagamento (cached 1h)
 */
router.get('/payment-methods', async (req, res) => {
  try {
    const paymentMethods = await billingOverviewService.getPaymentMethodsDistribution();
    
    res.json({
      success: true,
      data: paymentMethods,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching payment methods distribution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment methods distribution',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/billing/lifecycle
 * Subscription lifecycle (cached 1h)
 */
router.get('/lifecycle', async (req, res) => {
  try {
    const lifecycle = await billingOverviewService.getSubscriptionLifecycle();
    
    res.json({
      success: true,
      data: lifecycle,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching subscription lifecycle:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription lifecycle',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/admin/billing/invalidate-cache
 * Invalidar cache de billing
 */
router.post('/invalidate-cache', async (req, res) => {
  try {
    await billingOverviewService.invalidateBillingCache();
    
    res.json({
      success: true,
      message: 'Billing cache invalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error invalidating billing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate billing cache',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
