import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { requireAuth, requireAdmin, requireSuperAdmin, requireTenantAccess } from '../middleware/auth';
import auth from '../config/auth';
import { PrismaClient } from '@prisma/client';
import { UserService } from '../services/user.service';
import { CSVParser } from '../utils/csv-parser';
import { body, validationResult, query } from 'express-validator';
import { UserFilters, UserBulkAction, UserFormData } from '../../../shared/types';
import { UserRole, UserStatus } from '../middleware/auth';

// PrismaClient global compartilhado
const prisma = new PrismaClient();
const userService = new UserService(prisma);

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

// Get current user data - usando Better Auth com FitOSUser
router.get('/me', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  try {
    console.log('🔍 /api/users/me - Headers:', req.headers);
    console.log('🔍 /api/users/me - Cookies:', req.headers.cookie);
    
    // 1. Verificar sessão do Better Auth
    console.log('🔍 /api/users/me - Verificando sessão...');
    const session = await auth.api.getSession(req as any);
    console.log('🔍 /api/users/me - Session:', session);
    
    if (!session) {
      console.log('❌ /api/users/me - No session found');
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }
    
    console.log('✅ /api/users/me - Session found:', session.user.email);

    // 2. Buscar dados completos do usuário na tabela FitOSUser
    console.log('🔍 /api/users/me - Buscando usuário no banco...');
    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email
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
        tenantId: true
      }
    });

    console.log('🔍 /api/users/me - Usuário encontrado:', user);

    if (!user) {
      console.log('❌ /api/users/me - Usuário não encontrado no banco');
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // 3. Retornar dados formatados
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      role: user.role || 'MEMBER',
      status: user.status || 'ACTIVE',
      createdAt: user.createdAt,
      tenantId: user.tenantId || 'default-tenant'
    };

    logger.info(`User data retrieved for ${user.email}`);

    return res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('❌ /api/users/me - Error:', error);
    logger.error('Error fetching user data:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
}));

// Rota alternativa para buscar dados do usuário por email (temporária)
router.get('/by-email/:email', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  try {
    const { email } = req.params;
    console.log('🔍 /api/users/by-email - Buscando usuário:', email);
    
    const user = await prisma.user.findFirst({
      where: {
        email: email
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
        tenantId: true
      }
    });

    console.log('🔍 /api/users/by-email - Usuário encontrado:', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    return res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('❌ /api/users/by-email - Error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
}));

// Get current user profile - será implementado com Better Auth
router.get('/profile', asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
  const tenantId = req.tenantId;

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
  const tenantId = req.tenantId;

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

// Get all users (admin only) - Implementado com Better Auth
router.get('/', 
  requireAuth,
  requireAdmin,
  [
    query('search').optional().isString().trim(),
    query('role').optional().isIn(['MEMBER', 'TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']),
    query('createdFrom').optional().isISO8601(),
    query('createdTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['firstName', 'lastName', 'email', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
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

    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const filters: UserFilters = {
      search: req.query.search as string,
      role: req.query.role as UserRole,
      status: req.query.status as UserStatus,
      createdFrom: req.query.createdFrom as string,
      createdTo: req.query.createdTo as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any
    };

    const result = await userService.getUsers(filters, tenantId, req.user!.role);

    return res.json({
      success: true,
      data: result
    });
  })
);

// Get user by ID
router.get('/:id', 
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const user = await userService.getUserById(id, tenantId, req.user!.role);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    return res.json({
      success: true,
      data: user
    });
  })
);

// Create new user
router.post('/',
  requireAuth,
  requireAdmin,
  [
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['MEMBER', 'TRAINER', 'ADMIN', 'OWNER']).withMessage('Invalid role'),
    body('phone').optional().isString().trim(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
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

    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const userData: UserFormData = req.body;
    const user = await userService.createUser(userData, tenantId, req.user!.id);

    return res.status(201).json({
      success: true,
      data: user
    });
  })
);

// Update user
router.put('/:id',
  requireAuth,
  requireAdmin,
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('role').optional().isIn(['MEMBER', 'TRAINER', 'ADMIN', 'OWNER']),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
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

    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const userData: Partial<UserFormData> = req.body;
    const user = await userService.updateUser(id, userData, tenantId, req.user!.id);

    return res.json({
      success: true,
      data: user
    });
  })
);

// Delete user (soft delete)
router.delete('/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    await userService.deleteUser(id, tenantId, req.user!.id);

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

// Bulk actions
router.post('/bulk-action',
  requireAuth,
  requireAdmin,
  [
    body('action').isIn(['activate', 'deactivate', 'delete', 'export']),
    body('userIds').isArray({ min: 1 }),
    body('userIds.*').isString(),
    body('reason').optional().isString().trim()
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

    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const bulkAction: UserBulkAction = req.body;
    const result = await userService.bulkAction(bulkAction, tenantId, req.user!.id);

    return res.json({
      success: true,
      data: result
    });
  })
);

// Import CSV
router.post('/import-csv',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // TODO: Implementar upload de arquivo
    return res.status(501).json({
      success: false,
      error: { message: 'CSV import not implemented yet' }
    });
  })
);

// Reset password
router.post('/:id/reset-password',
  requireAuth,
  requireAdmin,
  [
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
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

    const { id } = req.params;
    const { newPassword } = req.body;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    await userService.resetUserPassword(id, newPassword, tenantId, req.user!.id);

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });
  })
);

// Export users to CSV
router.get('/export/csv',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const userIds = req.query.userIds ? (req.query.userIds as string).split(',') : [];
    const users = await userService.exportUsersToCSV(userIds, tenantId);

    // TODO: Implementar geração de CSV
    return res.json({
      success: true,
      data: users
    });
  })
);

export { router as userRoutes };