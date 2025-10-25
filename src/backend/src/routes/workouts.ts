import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, query } from 'express-validator';

// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';

// PrismaClient global compartilhado
const prisma = new PrismaClient();

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

    const {
      search,
      clientId,
      createdFrom,
      createdTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};

    // SUPER_ADMIN pode ver todos os workouts de todos os tenants
    // Outros roles precisam de tenantId específico
    if (req.user?.role !== 'SUPER_ADMIN' && tenantId) {
      where.tenantId = tenantId;
    }

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    if (clientId) {
      where.clientId = clientId;
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom as string);
      if (createdTo) where.createdAt.lte = new Date(createdTo as string);
    }

    // Validação de escopo por role
    if (req.user?.role === 'CLIENT') {
      where.clientId = req.user.id;
    } else if (req.user?.role === 'TRAINER' && tenantId) {
      // Trainers podem ver workouts dos membros que treinam
      where.client = {
        trainerId: req.user.id
      };
    }

    const [workouts, total] = await Promise.all([
      prisma.workout.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: sortBy === 'name' 
          ? { name: sortOrder as 'asc' | 'desc' }
          : { createdAt: sortOrder as 'asc' | 'desc' },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit)
      }),
      prisma.workout.count({ where })
    ]);

    return res.json({
      success: true,
      data: {
        treinos: workouts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
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

    const where: any = { id };

    // SUPER_ADMIN pode ver todos os workouts, outros roles precisam de tenantId
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Validação de escopo por role
    if (req.user?.role === 'CLIENT') {
      where.clientId = req.user.id;
    } else if (req.user?.role === 'TRAINER' && tenantId) {
      where.client = {
        trainerId: req.user.id
      };
    }

    const workout = await prisma.workout.findFirst({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

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

    const workout = await prisma.workout.create({
      data: {
        name,
        description,
        tenantId,
        clientId: targetMemberId,
        userId: req.user!.id,
        exercises: exercises || []
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

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

    const where: any = { id, tenantId };

    // Validação de escopo por role
    if (req.user?.role === 'CLIENT') {
      where.clientId = req.user.id;
    } else if (req.user?.role === 'TRAINER') {
      where.client = {
        trainerId: req.user.id
      };
    }

    const existingWorkout = await prisma.workout.findFirst({
      where
    });

    if (!existingWorkout) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workout not found or access denied' }
      });
    }

    const { name, description, exercises } = req.body;

    const workout = await prisma.workout.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(exercises && { exercises })
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info('Workout updated', {
      workoutId: workout.id,
      userId: req.user?.id,
      tenantId
    });

    return res.json({
      success: true,
      data: { workout }
    });
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

    const where: any = { id, tenantId };

    // Validação de escopo por role
    if (req.user?.role === 'CLIENT') {
      where.clientId = req.user.id;
    } else if (req.user?.role === 'TRAINER') {
      where.client = {
        trainerId: req.user.id
      };
    }

    const existingWorkout = await prisma.workout.findFirst({
      where
    });

    if (!existingWorkout) {
      return res.status(404).json({
        success: false,
        error: { message: 'Workout not found or access denied' }
      });
    }

    await prisma.workout.delete({
      where: { id }
    });

    logger.info('Workout deleted', {
      workoutId: id,
      userId: req.user?.id,
      tenantId
    });

    return res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  })
);

export { router as workoutRoutes };