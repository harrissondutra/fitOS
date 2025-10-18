import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';

const router = Router();

// Middleware to check admin role
const requireAdmin = (req: RequestWithTenant, res: Response, next: any) => {
  const userRole = req.headers['x-user-role'] as string;
  
  if (userRole !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required',
      },
    });
  }
  
  return next();
};

// Get tenant statistics
router.get('/stats', requireAdmin, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  const prisma = getPrismaClient();

  // Get various statistics
  const [
    userStats,
    workoutStats,
    chatStats,
    recentUsers,
    recentWorkouts,
  ] = await Promise.all([
    // User statistics
    prisma.fitOSUser.aggregate({
      where: { tenantId },
      _count: { id: true },
    }),
    
    // Workout statistics
    prisma.workout.aggregate({
      where: { tenantId },
      _count: { id: true },
    }),
    
    // Chat statistics
    prisma.chatMessage.aggregate({
      where: { tenantId },
      _count: { id: true },
    }),
    
    // Recent users
    prisma.fitOSUser.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    
    // Recent workouts
    prisma.workout.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return res.json({
    success: true,
    data: {
      stats: {
        totalUsers: userStats._count.id,
        totalWorkouts: workoutStats._count.id,
        totalMessages: chatStats._count.id,
      },
      recentUsers,
      recentWorkouts,
    },
  });
}));

// Get all users with pagination
router.get('/users', requireAdmin, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenantId;
  const { page = 1, limit = 20, search = '', role = '' } = req.query;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  const prisma = getPrismaClient();
  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

  // Build where clause
  const whereClause: any = {
    tenantId,
  };

  if (search) {
    whereClause.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (role) {
    whereClause.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.fitOSUser.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string, 10),
    }),
    prisma.fitOSUser.count({ where: whereClause }),
  ]);

  return res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        total,
        pages: Math.ceil(total / parseInt(limit as string, 10)),
      },
    },
  });
}));

// Update user role
router.put('/users/:id/role', requireAdmin, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  if (!['MEMBER', 'TRAINER', 'ADMIN'].includes(role)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid role',
      },
    });
  }

  const prisma = getPrismaClient();

  const user = await prisma.fitOSUser.update({
    where: {
      id,
      tenantId,
    },
    data: { role },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
    },
  });

  logger.info('User role updated', {
    userId: id,
    newRole: role,
    tenantId,
  });

  return res.json({
    success: true,
    data: { user },
  });
}));

// Update user status
router.put('/users/:id/status', requireAdmin, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid status',
      },
    });
  }

  const prisma = getPrismaClient();

  const user = await prisma.fitOSUser.update({
    where: {
      id,
      tenantId,
    },
    data: { status },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      status: true,
    },
  });

  logger.info('User status updated', {
    userId: id,
    newStatus: status,
    tenantId,
  });

  return res.json({
    success: true,
    data: { user },
  });
}));

export { router as adminRoutes };
