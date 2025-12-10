import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../middleware/permissions';
import { param, body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler';
import { createGoalWorkoutIntegrationService } from '../utils/service-factory';

import { getPrismaClient } from '../config/database';

const router = Router();

// Middleware de autenticação (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  authMiddleware.requireAuth()(req, res, next);
});

/**
 * @route GET /api/goal-integration/client/:clientId/goals
 * @desc Buscar goals do cliente com progresso
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/client/:clientId/goals',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  param('clientId').isString().notEmpty(),
  asyncHandler(async (req: any, res) => {
    const { clientId } = req.params;
    const { tenantId } = req.user;

    // Usar service com wrapper para garantir isolamento multi-tenant
    const goalIntegrationService = await createGoalWorkoutIntegrationService(req);
    const goals = await goalIntegrationService.getClientGoals(clientId, tenantId);

    res.json({ success: true, data: goals });
  })
);

/**
 * @route POST /api/goal-integration/client/:clientId/from-assessment
 * @desc Criar goals a partir de avaliação física
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/client/:clientId/from-assessment',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  param('clientId').isString().notEmpty(),
  [
    body('assessmentData').isObject(),
    body('targetDate').isISO8601()
  ],
  asyncHandler(async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { clientId } = req.params;
    const { tenantId } = req.user;
    const { assessmentData, targetDate } = req.body;

    // Usar service com wrapper para garantir isolamento multi-tenant
    const goalIntegrationService = await createGoalWorkoutIntegrationService(req);
    const goals = await goalIntegrationService.createGoalsFromAssessment({
      clientId,
      tenantId,
      assessmentData,
      targetDate: new Date(targetDate)
    });

    res.json({ success: true, data: goals, message: 'Goals criados com sucesso' });
  })
);

/**
 * @route POST /api/goal-integration/client/:clientId/update-from-workouts
 * @desc Atualizar goals baseado em workouts completados
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/client/:clientId/update-from-workouts',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  param('clientId').isString().notEmpty(),
  asyncHandler(async (req: any, res) => {
    const { clientId } = req.params;
    const { tenantId } = req.user;

    // Usar service com wrapper para garantir isolamento multi-tenant
    const goalIntegrationService = await createGoalWorkoutIntegrationService(req);
    const updatedGoals = await goalIntegrationService.updateGoalsFromWorkouts(clientId, tenantId);

    res.json({ 
      success: true, 
      data: updatedGoals, 
      message: `${updatedGoals.length} goals atualizados` 
    });
  })
);

/**
 * @route PUT /api/goal-integration/goal/:goalId/progress
 * @desc Atualizar progresso de um goal específico
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.put('/goal/:goalId/progress',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  param('goalId').isString().notEmpty(),
  [
    body('newCurrent').isFloat({ min: 0 })
  ],
  asyncHandler(async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { goalId } = req.params;
    const { tenantId } = req.user;
    const { newCurrent } = req.body;

    // Usar service com wrapper para garantir isolamento multi-tenant
    const goalIntegrationService = await createGoalWorkoutIntegrationService(req);
    const updatedGoal = await goalIntegrationService.updateGoalProgress(goalId, newCurrent, tenantId);

    res.json({ 
      success: true, 
      data: updatedGoal, 
      message: 'Progresso atualizado com sucesso' 
    });
  })
);

export default router;
