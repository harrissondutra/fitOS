import { Router, Request, Response, NextFunction } from 'express';
import { UserPreferencesService } from '../services/user-preferences.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { body, validationResult } from 'express-validator';
import { errorHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const userPreferencesService = new UserPreferencesService();

// Validadores
const validateUpdatePreferences = [
  body('fitnessGoals').optional().isArray().withMessage('Fitness goals must be an array'),
  body('preferredWorkoutTypes').optional().isArray().withMessage('Preferred workout types must be an array'),
  body('workoutDuration').optional().isString().withMessage('Workout duration must be a string'),
  body('intensityLevel').optional().isIn(['low', 'moderate', 'high', 'mixed']).withMessage('Invalid intensity level'),
  body('preferredWorkoutDays').optional().isArray().withMessage('Preferred workout days must be an array'),
  body('preferredWorkoutTime').optional().isIn(['morning', 'afternoon', 'evening', 'night']).withMessage('Invalid workout time'),
  body('dietaryRestrictions').optional().isArray().withMessage('Dietary restrictions must be an array'),
  body('nutritionGoals').optional().isArray().withMessage('Nutrition goals must be an array'),
  body('preferredMusicGenres').optional().isArray().withMessage('Preferred music genres must be an array'),
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be a boolean'),
  body('reminderFrequency').optional().isIn(['daily', 'weekly', 'custom']).withMessage('Invalid reminder frequency'),

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
 * GET /api/preferences
 * Obter preferências do usuário
 */
router.get(
  '/',
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

      const preferences = await userPreferencesService.getUserPreferences(userId, tenantId);

      res.json({
        success: true,
        data: preferences
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/preferences
 * Atualizar preferências do usuário
 */
router.put(
  '/',
  authenticateToken,
  tenantMiddleware,
  validateUpdatePreferences,
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

      const preferences = await userPreferencesService.updateUserPreferences(userId, tenantId, req.body);

      res.json({
        success: true,
        data: preferences,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/preferences/workouts
 * Obter workouts personalizados
 */
router.get(
  '/workouts',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { limit, offset } = req.query;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const workouts = await userPreferencesService.getPersonalizedWorkouts(
        userId,
        tenantId,
        {
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined
        }
      );

      res.json({
        success: true,
        data: workouts
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/preferences/workouts/recommended
 * Obter workouts recomendados
 */
router.get(
  '/workouts/recommended',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { limit } = req.query;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const recommendations = await userPreferencesService.getWorkoutRecommendations(
        userId,
        tenantId,
        limit ? parseInt(limit as string) : 5
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/preferences/workouts/from-template
 * Criar workout de template
 */
router.post(
  '/workouts/from-template',
  authenticateToken,
  tenantMiddleware,
  body('templateName').isString().notEmpty().withMessage('Template name is required'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { templateName } = req.body;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const workout = await userPreferencesService.createWorkoutFromTemplate(
        userId,
        tenantId,
        templateName
      );

      res.json({
        success: true,
        data: workout,
        message: 'Workout created from template'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

