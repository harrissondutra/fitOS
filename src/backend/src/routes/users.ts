import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { authMiddleware, requireAdmin, RequestWithAuth } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/profile', authMiddleware, asyncHandler(async (req: RequestWithAuth, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.tenant?.id;

  if (!userId || !tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId,
    },
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
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'User not found',
      },
    });
  }

  return res.json({
    success: true,
    data: { user },
  });
}));

// Update user profile
router.put('/profile', authMiddleware, asyncHandler(async (req: RequestWithAuth, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.tenant?.id;
  const { firstName, lastName, phone } = req.body;

  if (!userId || !tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  const user = await prisma.user.update({
    where: {
      id: userId,
      tenantId,
    },
    data: {
      firstName,
      lastName,
      phone,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      updatedAt: true,
    },
  });

  logger.info('User profile updated', {
    userId,
    tenantId,
  });

  return res.json({
    success: true,
    data: { user },
  });
}));

// Get all users (admin only)
router.get('/', authMiddleware, requireAdmin, asyncHandler(async (req: RequestWithAuth, res: Response) => {
  const tenantId = req.tenant?.id;

  if (!tenantId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  const prisma = getPrismaClient();

  const users = await prisma.user.findMany({
    where: {
      tenantId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return res.json({
    success: true,
    data: { users },
  });
}));

export { router as userRoutes };
