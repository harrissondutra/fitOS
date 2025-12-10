import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
// removed UserRole import to avoid conflicts; role is treated as any in Request type
import { getPrismaClient } from '../config/database';
import { ExerciseService, ExerciseFilters, ExerciseFormData } from '../services/exercise.service';
import { body, validationResult, query } from 'express-validator';
import { createExerciseService } from '../utils/service-factory';

import { UserRoles, UserRole } from '../constants/roles';

// PrismaClient global compartilhado (fallback para rotas sem tenant context)
const prisma = getPrismaClient();

const router = Router();

// Interface para requisições com tenant
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: any; // aceitar roles legadas
    tenantId?: string;
    name?: string;
  };
}

// Get all exercises - Auth removed
router.get('/',
  [
    query('search').optional().isString().trim(),
    query('category').optional().isString().trim(),
    query('muscleGroups').optional().isString().trim(),
    query('equipment').optional().isString().trim(),
    query('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    query('isPublic').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['name', 'category', 'difficulty', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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

    const filters: ExerciseFilters = {
      search: req.query.search as string,
      category: req.query.category as string,
      muscleGroups: req.query.muscleGroups ? (req.query.muscleGroups as string).split(',') : undefined,
      equipment: req.query.equipment as string,
      difficulty: req.query.difficulty as string,
      isPublic: req.query.isPublic ? req.query.isPublic === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any
    };

    // Usar service com wrapper para garantir isolamento multi-tenant
    const exerciseService = await createExerciseService(req);
    const result = await exerciseService.getExercises(filters, tenantId || 'default', req.user.role);

    return res.json({
      success: true,
      data: result
    });
  })
);

// Get exercise by ID
router.get('/:id',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const exercise = await exerciseService.getExerciseById(id, tenantId || 'default');

    if (!exercise) {
      return res.status(404).json({
        success: false,
        error: { message: 'Exercise not found' }
      });
    }

    return res.json({
      success: true,
      data: exercise
    });
  })
);

// Create new exercise (Admin only)
router.post('/',
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Exercise name is required'),
    body('description').optional().isString().trim(),
    body('category').isIn(['strength', 'cardio', 'flexibility', 'balance', 'sports']).withMessage('Invalid category'),
    body('muscleGroups').isArray({ min: 1 }).withMessage('At least one muscle group is required'),
    body('muscleGroups.*').isString().withMessage('Muscle group must be a string'),
    body('equipment').optional().isString().trim(),
    body('difficulty').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid difficulty'),
    body('instructions').isArray({ min: 1 }).withMessage('At least one instruction is required'),
    body('instructions.*').isString().withMessage('Instruction must be a string'),
    body('videoUrl').optional().isURL().withMessage('Invalid video URL'),
    body('thumbnailUrl').optional().isURL().withMessage('Invalid thumbnail URL'),
    body('isPublic').isBoolean().withMessage('isPublic must be a boolean')
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const exerciseData: ExerciseFormData = req.body;
    const exercise = await exerciseService.createExercise(exerciseData, tenantId || 'default', req.user.id);

    return res.status(201).json({
      success: true,
      data: exercise
    });
  })
);

// Update exercise (Admin only)
router.put('/:id',
  [
    body('name').optional().trim().isLength({ min: 1 }),
    body('description').optional().isString().trim(),
    body('category').optional().isIn(['strength', 'cardio', 'flexibility', 'balance', 'sports']),
    body('muscleGroups').optional().isArray({ min: 1 }),
    body('muscleGroups.*').optional().isString(),
    body('equipment').optional().isString().trim(),
    body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced']),
    body('instructions').optional().isArray({ min: 1 }),
    body('instructions.*').optional().isString(),
    body('videoUrl').optional().isURL(),
    body('thumbnailUrl').optional().isURL(),
    body('isPublic').optional().isBoolean()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

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
    const exerciseService = await createExerciseService(req);
    const exerciseData: Partial<ExerciseFormData> = req.body;
    const exercise = await exerciseService.updateExercise(id, exerciseData, tenantId || 'default');

    return res.json({
      success: true,
      data: exercise
    });
  })
);

// Delete exercise (Admin only)
router.delete('/:id',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

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
    const exerciseService = await createExerciseService(req);
    await exerciseService.deleteExercise(id, tenantId || 'default');

    return res.json({
      success: true,
      message: 'Exercise deleted successfully'
    });
  })
);

// Clone exercise
router.post('/:id/clone',
  [
    body('newName').trim().isLength({ min: 1 }).withMessage('New exercise name is required')
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const { newName } = req.body;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const exercise = await exerciseService.cloneExercise(id, tenantId || 'default');

    return res.status(201).json({
      success: true,
      data: exercise
    });
  })
);

// Get categories
router.get('/meta/categories',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const categories = await exerciseService.getCategories(tenantId || 'default');

    return res.json({
      success: true,
      data: categories
    });
  })
);

// Get muscle groups
router.get('/meta/muscle-groups',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const muscleGroups = await exerciseService.getMuscleGroups(tenantId || 'default');

    return res.json({
      success: true,
      data: muscleGroups
    });
  })
);

// Get equipment
router.get('/meta/equipment',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const equipment = await exerciseService.getEquipment(tenantId || 'default');

    return res.json({
      success: true,
      data: equipment
    });
  })
);

// Get exercises by category
router.get('/category/:category',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { category } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const exercises = await exerciseService.getExercisesByCategory(category, tenantId || 'default');

    return res.json({
      success: true,
      data: exercises
    });
  })
);

// Get exercises by muscle group
router.get('/muscle-group/:muscleGroup',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { muscleGroup } = req.params;
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const exercises = await exerciseService.getExercisesByMuscleGroup(muscleGroup, tenantId || 'default');

    return res.json({
      success: true,
      data: exercises
    });
  })
);

// Export exercises to CSV
router.get('/export/csv',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
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
    const exerciseService = await createExerciseService(req);
    const exerciseIds = req.query.exerciseIds ? (req.query.exerciseIds as string).split(',') : [];
    const exercises = await exerciseService.exportExercisesToCSV(tenantId || 'default');

    return res.json({
      success: true,
      data: exercises
    });
  })
);

export { router as exerciseRoutes };

