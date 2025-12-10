import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { validateUserLimit } from '../middleware/validateUserLimit';
// removed UserRole import to avoid conflicts; role is treated as any in Request type
import { getPrismaClient } from '../config/database';
import { UserService } from '../services/user.service';
import { createUserService } from '../utils/service-factory';
import { CSVParser } from '../utils/csv-parser';
import { body, validationResult, query } from 'express-validator';
import { UserFilters, UserBulkAction, UserFormData } from '../../../shared/types';

// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

// PrismaClient global (mantido apenas para usos diretos pontuais)
const prisma = getPrismaClient();

const router = Router();

// Interface para requisições com tenant
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: any;
    tenantId?: string;
    name?: string;
  };
}

// Get current user data - Auth removed
router.get('/me', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  try {
    console.log('🔍 /api/users/me - Headers:', req.headers);

    // Auth removed - returning error for now
    return res.status(501).json({
      success: false,
      error: { message: 'Authentication system has been removed' }
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

// Get all users (admin only) - Implemented with new auth
router.get('/',
  [
    query('search').optional().isString().trim(),
    query('role').optional().isIn(['CLIENT', 'TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']),
    query('createdFrom').optional().isISO8601(),
    query('createdTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['firstName', 'lastName', 'email', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  asyncHandler(async (req: Request, res: Response) => {
    try {
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

      console.log('🔍 /api/users - Headers:', req.headers);
      console.log('🔍 /api/users - Query:', req.query);

      // Para SUPER_ADMIN, buscar todos os usuários
      const filters: UserFilters = {
        search: req.query.search as string,
        role: (req.query.role as any),
        status: req.query.status as UserStatus,
        createdFrom: req.query.createdFrom as string,
        createdTo: req.query.createdTo as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as any
      };

      console.log('🔍 /api/users - Filters:', filters);

      // Usar service com wrapper para isolamento multi-tenant
      const userService = await createUserService(req);
      const tenantId = (req as any).tenantId || '';
      const users = await userService.getUsers(filters, tenantId, 'SUPER_ADMIN');

      const total = Array.isArray((users as any)) ? (users as any).length : (users as any).users?.length || 0;
      const totalPages = Math.ceil(total / (filters.limit || 10));

      console.log('📥 /api/users - Result:', { usersCount: total, total, totalPages });

      return res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: filters.page,
            limit: filters.limit,
            total,
            totalPages
          }
        }
      });

    } catch (error) {
      console.error('❌ /api/users - Error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Internal server error' }
      });
    }
  })
);

// Get user by ID - Auth removed
router.get('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      error: { message: 'Authentication system has been removed' }
    });

    /* Código comentado devido ao sistema de autenticação removido
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const user = await userService.getUserById(id, tenantId!, req.user!.role);

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
    */
  })
);

// Create new user - Auth removed
router.post('/',
  [
    body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
    body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['CLIENT', 'TRAINER', 'ADMIN', 'OWNER']).withMessage('Invalid role'),
    body('phone').optional().isString().trim(),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  ],
  validateUserLimit,
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
    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const userService = await createUserService(req);
    const userData: UserFormData = req.body;
    const user = await userService.createUser(userData, tenantId || '', req.user?.id || '');

    return res.status(201).json({
      success: true,
      data: user
    });
  })
);

// Update user - Auth removed
router.put('/:id',
  [
    body('firstName').optional().trim().isLength({ min: 1 }),
    body('lastName').optional().trim().isLength({ min: 1 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('role').optional().isIn(['CLIENT', 'TRAINER', 'ADMIN', 'OWNER']),
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

    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const userService = await createUserService(req);
    const userData: Partial<UserFormData> = req.body;
    const user = await userService.updateUser(id, userData, tenantId || '', req.user?.id || '');

    return res.json({
      success: true,
      data: user
    });
  })
);

// Delete user (soft delete) - Auth removed
router.delete('/:id',
  asyncHandler(async (req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      error: { message: 'Authentication system has been removed' }
    });

    /* Código comentado devido ao sistema de autenticação removido
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    await userService.deleteUser(id, tenantId!, req.user!.id);

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
    */
  })
);

// Bulk actions - Auth removed
router.post('/bulk-action',
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
    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const bulkAction: UserBulkAction = req.body;
    const { createUserService } = await import('../utils/service-factory');
    const userServiceInstance = await createUserService(req);
    const result = await userServiceInstance.bulkAction(bulkAction, tenantId!, req.user!.id);

    return res.json({
      success: true,
      data: result
    });
  })
);

// Import CSV - Auth removed
router.post('/import-csv',
  asyncHandler(async (req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      error: { message: 'Authentication system has been removed' }
    });

    /* Código comentado devido ao sistema de autenticação removido
    const tenantId = req.tenantId || req.user?.tenantId;
    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
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
    */
  })
);

// Reset password - Auth removed
router.post('/:id/reset-password',
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

    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const { createUserService: createUserService2 } = await import('../utils/service-factory');
    const userServiceInstance2 = await createUserService2(req);
    await userServiceInstance2.resetUserPassword(id, newPassword, tenantId!, req.user!.id);

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });
  })
);

// Export users to CSV - Auth removed
router.get('/export/csv',
  asyncHandler(async (req: Request, res: Response) => {
    return res.status(501).json({
      success: false,
      error: { message: 'Authentication system has been removed' }
    });

    /* Código comentado devido ao sistema de autenticação removido
    const tenantId = req.tenantId || req.user?.tenantId;
    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const userIds = req.query.userIds ? (req.query.userIds as string).split(',') : [];
    const users = await userService.exportUsersToCSV(userIds, tenantId!);

    // TODO: Implementar geração de CSV
    return res.json({
      success: true,
      data: users
    });
    */
  })
);

export { router as userRoutes };