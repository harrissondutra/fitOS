import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { getPrismaClient } from '../config/database';
import { body, validationResult, query } from 'express-validator';
import { createWorkoutService } from '../utils/service-factory';
import { WorkoutFilters } from '../services/workout.service';
import { UserRole } from '../../../shared/types/auth.types';
import { checkWorkoutLimit } from '../middleware/plan-limits.middleware';

// Usar tipo compartilhado de role

// PrismaClient global compartilhado
const prisma = getPrismaClient();

const router = Router();

// Interface para requisições com tenant
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

// Get all workouts - Auth removed
router.get('/',
  [
    query('search').optional().isString().trim(),
    query('clientId').optional().isString().trim(),
    query('createdFrom').optional().isISO8601(),
    query('createdTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['name', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid query parameters',
          details: errors.array()
        }
      });
    }

    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const workoutService = await createWorkoutService(req);

    const filters: WorkoutFilters = {
      search: req.query.search as string,
      clientId: req.query.clientId as string,
      userId: req.user?.id,
      createdFrom: req.query.createdFrom as string,
      createdTo: req.query.createdTo as string,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc'
    };

    const result = await workoutService.getWorkouts(
      filters,
      tenantId || '',
      (req.user?.role as any) || 'CLIENT',
      req.user?.id
    );

    return res.json({
      success: true,
      data: {
        treinos: result.workouts || [],
        pagination: result.pagination || {
          page: filters.page,
          limit: filters.limit,
          total: 0,
          pages: 0
        }
      }
    });
  })
);

// Get workout by ID
router.get('/:id',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const workoutService = await createWorkoutService(req);

    const workout = await workoutService.getWorkoutById(
      id,
      tenantId || '',
      (req.user?.role as any) || 'CLIENT',
      req.user?.id
    );

    if (!workout) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workout not found' }
      });
    }

    return res.json({
      success: true,
      data: { workout }
    });
  })
);

// Create new workout
router.post('/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('description').optional().isString(),
    body('clientId').optional().isString(),
    body('exercises').optional().isArray()
  ],
  checkWorkoutLimit,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const workoutService = await createWorkoutService(req);

    const { name, description, clientId, exercises = [] } = req.body;

    // Determinar clientId baseado no role
    let targetMemberId = clientId;
    if (req.user?.role === 'CLIENT') {
      targetMemberId = req.user.id;
    }

    if (!targetMemberId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Member ID is required' }
      });
    }

    const workout = await workoutService.createWorkout(
      {
        name,
        description,
        exercises: exercises || [],
        clientId: targetMemberId,
        aiGenerated: false
      },
      tenantId,
      req.user!.id
    );

    logger.info('Workout created', {
      workoutId: workout.id,
      userId: req.user?.id,
      tenantId
    });

    return res.status(201).json({
      success: true,
      data: { workout }
    });
  })
);

// Update workout
router.put('/:id',
  [
    body('name').optional().isString(),
    body('description').optional().isString(),
    body('exercises').optional().isArray()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid input data',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const workoutService = await createWorkoutService(req);

    const { name, description, exercises } = req.body;

    try {
      const workout = await workoutService.updateWorkout(
        id,
        { name, description, exercises },
        tenantId,
        req.user!.id,
        (req.user?.role as any) || 'CLIENT'
      );

      return res.json({
        success: true,
        data: { workout }
      });
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          error: { message: error.message }
        });
      }
      throw error;
    }
  })
);

// Delete workout
router.delete('/:id',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const workoutService = await createWorkoutService(req);

    try {
      await workoutService.deleteWorkout(
        id,
        tenantId,
        req.user!.id,
        (req.user?.role as any) || 'CLIENT'
      );

      return res.json({
        success: true,
        message: 'Workout deleted successfully'
      });
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({
          success: false,
          error: { message: error.message }
        });
      }
      throw error;
    }
  })
);

export { router as workoutRoutes };