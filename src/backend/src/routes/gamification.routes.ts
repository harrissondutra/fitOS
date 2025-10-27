import { Router, Request, Response, NextFunction } from 'express';
import { GamificationService } from '../services/gamification.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { body, validationResult } from 'express-validator';
import { errorHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const gamificationService = new GamificationService();

// Validadores
const validateCreateChallenge = [
  body('name').isString().notEmpty().withMessage('Name is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('type').isIn(['fitness', 'nutrition', 'wellness', 'custom']).withMessage('Invalid type'),
  body('category').isString().notEmpty().withMessage('Category is required'),
  body('startDate').isISO8601().withMessage('Invalid start date'),
  body('endDate').isISO8601().withMessage('Invalid end date'),
  body('requirements').isObject().withMessage('Requirements must be an object'),
  body('reward').isObject().withMessage('Reward must be an object'),
  body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * POST /api/gamification/challenges
 * Criar desafio
 */
router.post(
  '/challenges',
  authenticateToken,
  tenantMiddleware,
  validateCreateChallenge,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const challenge = await gamificationService.createChallenge(tenantId, req.body);

      res.status(201).json({
        success: true,
        data: challenge,
        message: 'Challenge created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/gamification/challenges
 * Listar desafios
 */
router.get(
  '/challenges',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const { page, limit } = req.query;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const challenges = await gamificationService.getChallenges(tenantId, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10
      });

      res.json({
        success: true,
        data: challenges
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/gamification/challenges/recommended
 * Desafios recomendados
 */
router.get(
  '/challenges/recommended',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const challenges = await gamificationService.getRecommendedChallenges(userId, tenantId);

      res.json({
        success: true,
        data: challenges
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/gamification/challenges/:id/join
 * Participar de desafio
 */
router.post(
  '/challenges/:id/join',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { id: challengeId } = req.params;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const participant = await gamificationService.joinChallenge(userId, challengeId, tenantId);

      res.status(201).json({
        success: true,
        data: participant,
        message: 'Successfully joined challenge'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/gamification/challenges/:id/progress
 * Ver progresso no desafio
 */
router.get(
  '/challenges/:id/progress',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { id: challengeId } = req.params;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Implementar busca de progresso
      res.json({
        success: true,
        data: { challengeId, userId, progress: {} }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/gamification/challenges/:id/progress
 * Atualizar progresso
 */
router.put(
  '/challenges/:id/progress',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { id: challengeId } = req.params;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const participant = await gamificationService.updateProgress(
        userId,
        challengeId,
        tenantId,
        req.body
      );

      res.json({
        success: true,
        data: participant,
        message: 'Progress updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/gamification/badges
 * Listar badges disponíveis
 */
router.get(
  '/badges',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      // Implementar busca de badges
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/gamification/users/:id/badges
 * Badges do usuário
 */
router.get(
  '/users/:id/badges',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const tenantId = req.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const badges = await gamificationService.getUserBadges(userId, tenantId);

      res.json({
        success: true,
        data: badges
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

