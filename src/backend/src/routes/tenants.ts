import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { TenantService } from '../services/tenant.service';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const tenantService = new TenantService(null as any);

// Validation rules
const createTenantValidation = [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('subdomain').trim().isLength({ min: 3, max: 50 }).withMessage('Subdomain must be between 3 and 50 characters'),
  body('subdomain').matches(/^[a-z0-9-]+$/).withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens'),
  body('billingEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('customDomain').optional().isFQDN().withMessage('Custom domain must be a valid FQDN'),
  body('plan').optional().isIn(['starter', 'professional', 'enterprise']).withMessage('Invalid plan'),
];

const updateTenantValidation = [
  body('name').optional().trim().isLength({ min: 1 }).withMessage('Name cannot be empty'),
  body('subdomain').optional().trim().isLength({ min: 3, max: 50 }).withMessage('Subdomain must be between 3 and 50 characters'),
  body('subdomain').optional().matches(/^[a-z0-9-]+$/).withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens'),
  body('customDomain').optional().isFQDN().withMessage('Custom domain must be a valid FQDN'),
  body('status').optional().isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status'),
  body('plan').optional().isIn(['starter', 'professional', 'enterprise']).withMessage('Invalid plan'),
];

// Create new tenant
router.post('/', rateLimiter, createTenantValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }

  const { name, subdomain, customDomain, billingEmail, plan, settings } = req.body;

  try {
    const tenant = await tenantService.createTenant({
      name,
      subdomain,
      customDomain,
      billingEmail,
      plan,
      settings,
    });

    logger.info('Tenant created via API', {
      tenantId: tenant?.id,
      subdomain,
      customDomain,
    });

    return res.status(201).json({
      success: true,
      data: { tenant },
    });
  } catch (error: any) {
    logger.error('Error creating tenant:', error);
    return res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to create tenant',
      },
    });
  }
}));

// Get tenant by ID
router.get('/:id', rateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const tenant = await tenantService.resolveTenantById(id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tenant not found',
        },
      });
    }

    return res.json({
      success: true,
      data: { tenant },
    });
  } catch (error) {
    logger.error('Error getting tenant:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get tenant',
      },
    });
  }
}));

// Update tenant
router.put('/:id', rateLimiter, updateTenantValidation, asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array(),
      },
    });
  }

  const { id } = req.params;
  const updates = req.body;

  try {
    const tenant = await tenantService.updateTenant(id, updates);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tenant not found',
        },
      });
    }

    logger.info('Tenant updated via API', {
      tenantId: id,
      updates,
    });

    return res.json({
      success: true,
      data: { tenant },
    });
  } catch (error: any) {
    logger.error('Error updating tenant:', error);
    return res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update tenant',
      },
    });
  }
}));

// Delete tenant (soft delete)
router.delete('/:id', rateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const success = await tenantService.deleteTenant(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tenant not found',
        },
      });
    }

    logger.info('Tenant deleted via API', { tenantId: id });

    return res.json({
      success: true,
      message: 'Tenant deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting tenant:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete tenant',
      },
    });
  }
}));

// List tenants
router.get('/', rateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { status, plan, limit, offset } = req.query;

  try {
    const filters = {
      ...(status && { status: status as 'active' | 'inactive' | 'suspended' }),
      ...(plan && { plan: plan as string }),
      ...(limit && { limit: parseInt(limit as string, 10) }),
      ...(offset && { offset: parseInt(offset as string, 10) }),
    };

    const result = await tenantService.listTenants(filters);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error listing tenants:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to list tenants',
      },
    });
  }
}));

// Get current tenant info (for authenticated requests)
router.get('/me/info', rateLimiter, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenantId;

  if (!tenantId) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  return res.json({
    success: true,
    data: { tenantId },
  });
}));

// Update current tenant settings
router.put('/me/settings', rateLimiter, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenantId;
  const { settings } = req.body;

  if (!tenantId) {
    return res.status(404).json({
      success: false,
      error: {
        message: 'Tenant not found',
      },
    });
  }

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Settings must be a valid object',
      },
    });
  }

  try {
    const updatedTenant = await tenantService.updateTenant(tenantId, { settings });

    logger.info('Tenant settings updated via API', {
      tenantId: tenantId,
      settings,
    });

    return res.json({
      success: true,
      data: { tenant: updatedTenant },
    });
  } catch (error: any) {
    logger.error('Error updating tenant settings:', error);
    return res.status(400).json({
      success: false,
      error: {
        message: error.message || 'Failed to update tenant settings',
      },
    });
  }
}));

// Public route for plan info (used by AdWrapper)
router.get('/public/:tenantId/plan-info', rateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { tenantId } = req.params;

  try {
    const tenant = await tenantService.resolveTenantById(tenantId);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tenant not found',
        },
      });
    }

    // Return only necessary information for ad rendering
    return res.json({
      success: true,
      data: {
        plan: tenant.plan,
        adsEnabled: tenant.adsEnabled ?? true, // Default to true if not set
        tenantType: tenant.tenantType,
      },
    });
  } catch (error) {
    logger.error('Error getting tenant plan info:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get tenant plan info',
      },
    });
  }
}));

export { router as tenantRoutes };
