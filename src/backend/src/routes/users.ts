import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';

const router = Router();

// Interface para requisições com tenant
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

// Get current user profile - será implementado com Better Auth
router.get('/profile', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  const tenantId = req.tenant?.id;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
    return;
  }

  // Por enquanto, retornar erro 501 - implementar com Better Auth
  res.status(501).json({
    success: false,
    error: {
      message: 'Esta funcionalidade será implementada com Better Auth',
    },
  });
}));

// Update user profile - será implementado com Better Auth
router.put('/profile', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  const tenantId = req.tenant?.id;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
    return;
  }

  // Por enquanto, retornar erro 501 - implementar com Better Auth
  res.status(501).json({
    success: false,
    error: {
      message: 'Esta funcionalidade será implementada com Better Auth',
    },
  });
}));

// Get all users (admin only) - será implementado com Better Auth
router.get('/', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  const tenantId = req.tenant?.id;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
    return;
  }

  // Por enquanto, retornar erro 501 - implementar com Better Auth
  res.status(501).json({
    success: false,
    error: {
      message: 'Esta funcionalidade será implementada com Better Auth',
    },
  });
}));

// Update user (admin only) - será implementado com Better Auth
router.put('/:id', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  const tenantId = req.tenant?.id;

  if (!tenantId) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
    return;
  }

  // Por enquanto, retornar erro 501 - implementar com Better Auth
  res.status(501).json({
    success: false,
    error: {
      message: 'Esta funcionalidade será implementada com Better Auth',
    },
  });
}));

export { router as userRoutes };