import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
// import { requireAuth, requireAdmin, requireSuperAdmin } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { PlanLimitsService } from '../services/plan-limits.service';
import { 
  checkWorkoutLimit, 
  checkClientLimit, 
  checkStorageLimit, 
  trackUsage, 
  requireFeature, 
  getUsageStats, 
  getCurrentMonthUsage 
} from '../middleware/plan-limits.middleware';
import { body, validationResult, query } from 'express-validator';

import { UserRole } from '../../../shared/types/auth.types';

// PrismaClient global compartilhado
const prisma = new PrismaClient();
const planLimitsService = new PlanLimitsService(prisma);

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

// Get plan limits and usage statistics
router.get('/usage',
  getUsageStats,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const usageStats = req.usageStats!;

    return res.json({
      success: true,
      data: usageStats
    });
  })
);

// Get enabled features
router.get('/features',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const enabledFeatures = await planLimitsService.getEnabledFeatures(tenantId!);

    return res.json({
      success: true,
      data: enabledFeatures
    });
  })
);

// Get usage history
router.get('/history',
  getCurrentMonthUsage,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const monthlyUsage = req.monthlyUsage!;

    return res.json({
      success: true,
      data: monthlyUsage
    });
  })
);

// Check specific limits
router.get('/check/workouts',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const limitCheck = await planLimitsService.checkWorkoutLimit(tenantId!);

    return res.json({
      success: true,
      data: limitCheck
    });
  })
);

router.get('/check/members',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const limitCheck = await planLimitsService.checkClientLimit(tenantId!);

    return res.json({
      success: true,
      data: limitCheck
    });
  })
);

router.get('/check/storage',
  [
    query('sizeInMB').isFloat({ min: 0 }).withMessage('Size must be a positive number')
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

    const tenantId = req.tenantId || req.user?.tenantId;
    const sizeInMB = parseFloat(req.query.sizeInMB as string);

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const limitCheck = await planLimitsService.checkStorageLimit(tenantId!, sizeInMB);

    return res.json({
      success: true,
      data: limitCheck
    });
  })
);

// Add extra slots (Super Admin only)
router.post('/extra-slots',
  [
    body('tenantId!').isString().withMessage('Tenant ID is required'),
    body('role').isIn(['owner', 'admin', 'trainer', 'member']).withMessage('Invalid role'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer')
  ],
  asyncHandler(async (req: Request, res: Response) => {
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

    const { tenantId, role, quantity } = req.body;

    await planLimitsService.addExtraSlots(tenantId!, role, quantity);

    logger.info(`Extra slots added: ${quantity} ${role} slots for tenant ${tenantId!} by ${req.user!.id}`);

    return res.json({
      success: true,
      message: `Added ${quantity} extra ${role} slots successfully`
    });
  })
);

// Convert tenant to business (Super Admin only)
router.post('/convert-to-business',
  [
    body('tenantId!').isString().withMessage('Tenant ID is required'),
    body('subdomain').isString().isLength({ min: 3, max: 50 }).withMessage('Subdomain must be 3-50 characters')
  ],
  asyncHandler(async (req: Request, res: Response) => {
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

    const { tenantId, subdomain } = req.body;

    await planLimitsService.convertToBusiness(tenantId!, subdomain);

    logger.info(`Tenant converted to business: ${tenantId!} with subdomain ${subdomain} by ${req.user!.id}`);

    return res.json({
      success: true,
      message: 'Tenant converted to business successfully'
    });
  })
);

// Track custom event
router.post('/track-event',
  [
    body('eventType').isString().isLength({ min: 1 }).withMessage('Event type is required'),
    body('eventData').isObject().withMessage('Event data must be an object')
  ],
  trackUsage('custom_event'),
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

    const tenantId = req.tenantId || req.user?.tenantId;
    const { eventType, eventData } = req.body;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    await planLimitsService.trackEvent(tenantId!, eventType, eventData, req.user!.id);

    return res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  })
);

// Get user count by role
router.get('/user-counts',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const userCounts = await planLimitsService.getUserCountByRole(tenantId!);

    return res.json({
      success: true,
      data: userCounts
    });
  })
);

// Get plan limits only
router.get('/limits',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const limits = await planLimitsService.getPlanLimits(tenantId!);

    return res.json({
      success: true,
      data: limits
    });
  })
);

// Check if tenant can have subdomain
router.get('/can-have-subdomain',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId! específico
    if (!tenantId! && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId! },
      select: { tenantType: true }
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const canHaveSubdomain = await planLimitsService.canHaveSubdomain(tenant.tenantType);

    return res.json({
      success: true,
      data: { canHaveSubdomain }
    });
  })
);

export { router as planLimitsRoutes };
