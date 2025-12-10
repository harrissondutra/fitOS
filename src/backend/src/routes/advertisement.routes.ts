/**
 * Advertisement API Routes - FitOS Monetization System
 * 
 * Rotas para gestão de anúncios com autenticação JWT e validação.
 * - Rotas públicas: buscar anúncios por posição/contexto
 * - Rotas admin: CRUD completo de anúncios
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { AdvertisementService } from '../services/advertisement.service';       
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import { logger } from '../utils/logger';

const router = Router();
const authMiddleware = getAuthMiddleware();
const advertisementService = new AdvertisementService();

// ============================================================================
// ROTAS PÚBLICAS - Buscar anúncios
// ============================================================================

/**
 * GET /api/advertisements
 * Busca anúncios ativos por posição e contexto
 * Query params: position, context, limit
 */
router.get(
  '/',
  [
    query('position').optional().isIn(['header', 'sidebar', 'footer', 'between-content', 'interstitial']),
    query('context').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 10 }).toInt(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const { position, context, limit } = req.query;
    const tenantId = req.headers['x-tenant-id'] as string || req.tenantId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    const ads = await advertisementService.getActiveAdsByPosition(
      tenantId,
      position as string,
      context as string,
      limit ? Number(limit) : 3
    );

    res.json({
      success: true,
      data: ads
    });
  })
);

/**
 * POST /api/advertisements/track
 * Registra visualização ou clique em anúncio
 */
router.post(
  '/track',
  [
    body('adId').isString().notEmpty(),
    body('eventType').isIn(['view', 'click']),
    body('position').optional().isString(),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        errors: errors.array()
      });
    }

        const { adId, eventType, position } = req.body;
    const tenantId = req.headers['x-tenant-id'] as string || req.tenantId;
    const userId = (req as any).user?.id;

    // Registrar evento baseado no tipo
    if (eventType === 'impression') {
      await advertisementService.registerImpression(adId, tenantId, 0.5, userId);
    } else if (eventType === 'click') {
      await advertisementService.registerClick(adId, tenantId, userId);
    } else if (eventType === 'conversion') {
      await advertisementService.registerConversion(adId, tenantId);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid event type. Must be: impression, click, or conversion'
      });
    }

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  })
);

// ============================================================================
// ROTAS ADMIN - Gerenciamento de anúncios
// ============================================================================

// Middleware de autenticação para rotas admin
router.use('/admin', authMiddleware.requireAuth);
router.use('/admin', (req: any, res: Response, next: NextFunction) => {
  // Verificar se usuário é admin ou owner
  const userRole = req.user?.role;
  if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
    return res.status(403).json({
      success: false,
      error: 'Insufficient permissions'
    });
  }
  next();
});

/**
 * GET /api/advertisements/admin
 * Lista todos os anúncios do tenant (admin)
 */
router.get(
  '/admin',
  asyncHandler(async (req: any, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID required'
      });
    }

    const ads = await advertisementService.listAdvertisements(tenantId);

    res.json({
      success: true,
      data: ads
    });
  })
);

/**
 * GET /api/advertisements/admin/:id
 * Busca anúncio específico por ID (admin)
 */
router.get(
  '/admin/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    const ads = await advertisementService.listAdvertisements(tenantId);
    const ad = ads.find(a => a.id === id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Advertisement not found'
      });
    }

    res.json({
      success: true,
      data: ad
    });
  })
);

/**
 * POST /api/advertisements/admin
 * Cria novo anúncio (admin)
 */
router.post(
  '/admin',
  [
    body('type').isIn(['google_adsense', 'custom', 'affiliate']),
    body('position').isIn(['header', 'sidebar', 'footer', 'between-content', 'interstitial']),
    body('title').isString().notEmpty(),
    body('imageUrl').optional().isURL(),
    body('targetUrl').isURL(),
    body('isActive').optional().isBoolean(),
    body('priority').optional().isInt({ min: 1, max: 10 }).toInt(),
    body('targetAudience').optional().isObject(),
  ],
  asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        errors: errors.array()
      });
    }

    const tenantId = req.tenantId || req.user?.tenantId;

    const ad = await advertisementService.createAdvertisement({
      ...req.body,
      tenantId
    });

    res.status(201).json({
      success: true,
      data: ad,
      message: 'Advertisement created successfully'
    });
  })
);

/**
 * PUT /api/advertisements/admin/:id
 * Atualiza anúncio existente (admin)
 */
router.put(
  '/admin/:id',
  [
    body('type').optional().isIn(['google_adsense', 'custom', 'affiliate']),
    body('position').optional().isIn(['header', 'sidebar', 'footer', 'between-content', 'interstitial']),
    body('title').optional().isString().notEmpty(),
    body('imageUrl').optional().isURL(),
    body('targetUrl').optional().isURL(),
    body('isActive').optional().isBoolean(),
    body('priority').optional().isInt({ min: 1, max: 10 }).toInt(),
  ],
  asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    const ad = await advertisementService.updateAdvertisement(id, tenantId, req.body);

    if (!ad) {
      return res.status(404).json({
        success: false,
        error: 'Advertisement not found'
      });
    }

    res.json({
      success: true,
      data: ad,
      message: 'Advertisement updated successfully'
    });
  })
);

/**
 * DELETE /api/advertisements/admin/:id
 * Deleta anúncio (soft delete) (admin)
 */
router.delete(
  '/admin/:id',
  asyncHandler(async (req: any, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    await advertisementService.deleteAdvertisement(id, tenantId);

    res.json({
      success: true,
      message: 'Advertisement deleted successfully'
    });
  })
);

/**
 * GET /api/advertisements/admin/analytics/overview
 * Retorna analytics consolidado de anúncios (admin)
 */
router.get(
  '/admin/analytics/overview',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const tenantId = req.tenantId || req.user?.tenantId;
    const { startDate, endDate } = req.query;

        // Buscar todos os anúncios do tenant e agregar estatísticas
    const ads = await advertisementService.listAdvertisements(tenantId);
    const analytics = {
      totalAds: ads.length,
      activeAds: ads.filter(a => a.isActive).length,
      totalImpressions: ads.reduce((sum, ad) => sum + ad.impressionCount, 0),
      totalClicks: ads.reduce((sum, ad) => sum + ad.clickCount, 0),
      totalConversions: ads.reduce((sum, ad) => sum + ad.conversionCount, 0),
      avgCTR: ads.length > 0 
        ? (ads.reduce((sum, ad) => sum + (ad.impressionCount > 0 ? (ad.clickCount / ad.impressionCount) : 0), 0) / ads.length) * 100
        : 0,
      avgRelevance: ads.length > 0
        ? ads.reduce((sum, ad) => sum + ad.avgRelevanceScore, 0) / ads.length
        : 0
    };

    res.json({
      success: true,
      data: analytics
    });
  })
);

/**
 * GET /api/advertisements/admin/analytics/:adId
 * Retorna analytics específico de um anúncio (admin)
 */
router.get(
  '/admin/analytics/:adId',
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
  ],
  asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        errors: errors.array()
      });
    }

    const { adId } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;
    const { startDate, endDate } = req.query;

        const analytics = await advertisementService.getAdvertisementStats(adId);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Advertisement not found'
      });
    }

    res.json({
      success: true,
      data: analytics
    });
  })
);

export default router;
