import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';

const router = Router();

// Get all workouts
router.get('/', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenantId;
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  const prisma = getPrismaClient();

  // Build where clause based on user role
  const whereClause: any = {
    tenantId,
  };

  // Regular users can only see their own workouts
  if (userRole === 'MEMBER') {
    whereClause.userId = userId;
  }

  const workouts = await prisma.workout.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.json({
    success: true,
    data: { workouts },
  });
}));

// Get workout by ID
router.get('/:id', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  const prisma = getPrismaClient();

  const workout = await prisma.workout.findFirst({
    where: {
      id,
      tenantId,
      // Regular users can only see their own workouts
      ...(userRole === 'MEMBER' && { userId }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!workout) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Workout not found',
      },
    });
  }

  return res.json({
    success: true,
    data: { workout },
  });
}));

// Create new workout
router.post('/', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenantId;
  const userId = req.headers['x-user-id'] as string;
  const { name, description, exercises } = req.body;

  if (!tenantId || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  const workout = await prisma.workout.create({
    data: {
      name,
      description,
      tenantId,
      userId,
      memberId: userId, // Using userId as memberId for now
      exercises: exercises || [],
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info('Workout created', {
    workoutId: workout.id,
    userId,
    tenantId,
  });

  return res.status(201).json({
    success: true,
    data: { workout },
  });
}));

// Update workout
router.put('/:id', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const { name, description, exercises } = req.body;

  if (!tenantId || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  // Check if workout exists and user has permission
  const existingWorkout = await prisma.workout.findFirst({
    where: {
      id,
      tenantId,
      // Regular users can only update their own workouts
      ...(userRole === 'MEMBER' && { userId }),
    },
  });

  if (!existingWorkout) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Workout not found or access denied',
      },
    });
  }

  // Update workout
  const workout = await prisma.workout.update({
    where: { id },
    data: {
      name,
      description,
      // Update exercises if provided
      ...(exercises && {
        exercises: exercises,
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  logger.info('Workout updated', {
    workoutId: workout.id,
    userId,
    tenantId,
  });

  return res.json({
    success: true,
    data: { workout },
  });
}));

// Delete workout
router.delete('/:id', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const { id } = req.params;
  const tenantId = req.tenantId;
  const userId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;

  if (!tenantId || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  // Check if workout exists and user has permission
  const existingWorkout = await prisma.workout.findFirst({
    where: {
      id,
      tenantId,
      // Regular users can only delete their own workouts
      ...(userRole === 'MEMBER' && { userId }),
    },
  });

  if (!existingWorkout) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Workout not found or access denied',
      },
    });
  }

  // Delete workout (cascade will handle exercises)
  await prisma.workout.delete({
    where: { id },
  });

  logger.info('Workout deleted', {
    workoutId: id,
    userId,
    tenantId,
  });

  return res.json({
    success: true,
    message: 'Workout deleted successfully',
  });
}));

export { router as workoutRoutes };
