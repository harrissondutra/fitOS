import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { ExerciseService } from '../services/exercise.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { body, query, param } from 'express-validator';
import { UserRole } from '../../../shared/types/auth.types';

const router = Router();
const prisma = getPrismaClient();
const exerciseService = new ExerciseService(prisma);

// Extend Request interface
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

// GET /api/exercises - Listar exercícios
router.get(
  '/',
  authenticateToken,
  tenantMiddleware,
  [
    query('search').optional().isString(),
    query('category').optional().isString(),
    query('difficulty').optional().isString(),
    query('isPublic').optional().isBoolean(),
    query('muscleGroups').optional().isString()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { search, category, difficulty, isPublic, muscleGroups } = req.query;

    const filters = {
      search: search as string,
      category: category as string,
      difficulty: difficulty as string,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      muscleGroups: muscleGroups ? (muscleGroups as string).split(',') : undefined
    };

    const exercises = await exerciseService.getExercises(filters, req.tenantId);

    res.json({
      success: true,
      data: { exercises }
    });
  })
);

// GET /api/exercises/:id - Buscar exercício por ID
router.get(
  '/:id',
  authenticateToken,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    const exercise = await exerciseService.getExerciseById(id, req.tenantId);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: 'Exercise not found'
      });
    }

    res.json({
      success: true,
      data: { exercise }
    });
  })
);

// POST /api/exercises - Criar exercício
router.post(
  '/',
  authenticateToken,
  tenantMiddleware,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('difficulty').optional().isString(),
    body('muscleGroups').optional().isArray()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const exercise = await exerciseService.createExercise(
      req.body,
      req.tenantId,
      req.user!.id
    );

    res.status(201).json({
      success: true,
      data: { exercise }
    });
  })
);

// PUT /api/exercises/:id - Atualizar exercício
router.put(
  '/:id',
  authenticateToken,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    const exercise = await exerciseService.updateExercise(id, req.body, req.tenantId);

    res.json({
      success: true,
      data: { exercise }
    });
  })
);

// DELETE /api/exercises/:id - Deletar exercício
router.delete(
  '/:id',
  authenticateToken,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    await exerciseService.deleteExercise(id, req.tenantId);

    res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  })
);

export { router as exerciseRoutes };

