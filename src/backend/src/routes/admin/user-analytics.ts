/**
 * User Analytics Routes - FitOS
 * 
 * Rotas para analytics de usuários
 */

import { Router } from 'express';
import { userAnalyticsService } from '../../services/user-analytics.service';
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
 * GET /api/admin/user-analytics/overview
 * Métricas gerais de engagement (cached 5min)
 */
router.get('/overview', async (req, res) => {
  try {
    const overview = await userAnalyticsService.getUserEngagementOverview();
    
    addCacheHeaders(res, overview.fromCache || false, overview.cachedAt);
    
    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user engagement overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user engagement overview',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/user-analytics/engagement
 * Engagement detalhado (cached 5min)
 * Query params: date (YYYY-MM-DD), force_refresh (boolean)
 */
router.get('/engagement', async (req, res) => {
  try {
    const { date, force_refresh } = req.query;
    
    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
          timestamp: new Date().toISOString()
        });
      }
    }

    const engagement = await userAnalyticsService.getEngagementMetrics(targetDate);
    
    addCacheHeaders(res, engagement.fromCache || false, engagement.cachedAt);
    
    res.json({
      success: true,
      data: engagement,
      date: targetDate.toISOString().split('T')[0],
      forceRefresh: force_refresh === 'true',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching engagement metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch engagement metrics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/user-analytics/retention
 * Retention cohorts (cached 24h)
 * Query params: start_date, end_date, period (7d, 30d, 90d)
 */
router.get('/retention', async (req, res) => {
  try {
    const { start_date, end_date, period = '30d' } = req.query;
    
    let startDate: Date;
    let endDate: Date;
    
    if (start_date && end_date) {
      startDate = new Date(start_date as string);
      endDate = new Date(end_date as string);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Default: últimos 90 dias
      endDate = new Date();
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }

    const cohorts = await userAnalyticsService.getRetentionCohorts(startDate, endDate);
    
    res.json({
      success: true,
      data: cohorts,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      period,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching retention cohorts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch retention cohorts',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/user-analytics/features
 * Feature adoption (cached 30min)
 */
router.get('/features', async (req, res) => {
  try {
    const features = await userAnalyticsService.getFeatureAdoption();
    
    res.json({
      success: true,
      data: features,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching feature adoption:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature adoption',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/user-analytics/sessions
 * Session analytics (cached 5min)
 */
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await userAnalyticsService.getSessionAnalytics();
    
    res.json({
      success: true,
      data: sessions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching session analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch session analytics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/user-analytics/journey
 * User journey funnel (cached 1h)
 */
router.get('/journey', async (req, res) => {
  try {
    const journey = await userAnalyticsService.getUserJourneyFunnel();
    
    res.json({
      success: true,
      data: journey,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching user journey funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user journey funnel',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/user-analytics/top-users
 * Top active users (cached 5min)
 * Query params: limit (default 10)
 */
router.get('/top-users', async (req, res) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit. Must be between 1 and 100',
        timestamp: new Date().toISOString()
      });
    }

    const topUsers = await userAnalyticsService.getTopActiveUsers(limitNum);
    
    res.json({
      success: true,
      data: topUsers,
      limit: limitNum,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching top active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top active users',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
