/**
 * System Health Routes - FitOS
 * 
 * Rotas para monitoramento de saúde do sistema
 */

import { Router } from 'express';
import { systemHealthService } from '../../services/system-health.service';
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
 * GET /api/admin/system-health/overview
 * Overview geral do sistema (cached 30s)
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await systemHealthService.getSystemHealthOverview();
    
    addCacheHeaders(res, overview.fromCache || false, overview.cachedAt);
    
    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching system health overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health overview',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/system-health/services
 * Status de cada serviço (cached 60s)
 */
router.get('/services', async (req, res) => {
  try {
    const services = await systemHealthService.getServicesStatus();
    
    res.json({
      success: true,
      data: services,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching services status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/system-health/metrics
 * Métricas de performance (cached 5min)
 * Query params: period (1h, 24h, 7d, 30d)
 */
router.get('/metrics', async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    if (!['1h', '24h', '7d', '30d'].includes(period as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be one of: 1h, 24h, 7d, 30d',
        timestamp: new Date().toISOString()
      });
    }

    const metrics = await systemHealthService.getSystemMetrics(period as '1h' | '24h' | '7d' | '30d');
    
    res.json({
      success: true,
      data: metrics,
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/system-health/alerts
 * Alertas ativos (cached 10s)
 */
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await systemHealthService.getActiveAlerts();
    
    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active alerts',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/system-health/history
 * Histórico de métricas (cached 1h)
 * Query params: range (24h, 7d, 30d)
 */
router.get('/history', async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    
    if (!['24h', '7d', '30d'].includes(range as string)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid range. Must be one of: 24h, 7d, 30d',
        timestamp: new Date().toISOString()
      });
    }

    const history = await systemHealthService.getPerformanceHistory(range as '24h' | '7d' | '30d');
    
    res.json({
      success: true,
      data: history,
      range,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching performance history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance history',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/system-health/cache-metrics
 * Métricas de cache Redis
 */
router.get('/cache-metrics', async (req, res) => {
  try {
    const cacheMetrics = await systemHealthService.getCacheMetrics();
    
    res.json({
      success: true,
      data: cacheMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching cache metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/system-health/health
 * Health check simples
 */
router.get('/health', async (req, res) => {
  try {
    const health = await systemHealthService.healthCheck();
    
    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
