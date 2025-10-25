import { Router, Request, Response } from 'express';
import { getTenantPrisma, getTenantIdFromRequest } from '../lib/prisma-tenant';
import { RequestWithTenant } from '../middleware/tenant';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Exemplo de rota que usa PrismaClient por tenant
 * GET /api/tenant-example/users
 */
router.get('/api/tenant-example/users',  async (req: RequestWithTenant, res: Response) => {
  try {
    // req.user já está populado pelo middleware requireAuth
    const authenticatedUser = req.user!;

    // 2. Obter PrismaClient do tenant
    const tenantId = getTenantIdFromRequest(req);
    const db = getTenantPrisma(tenantId);

    // 3. Buscar dados no schema do tenant
    const users = await db.user.findMany({
      where: {
        tenantId: tenantId
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true
      }
    });

    logger.info(`Found ${users.length} users for tenant ${tenantId}`);

    return res.json({
      success: true,
      data: {
        users,
        tenantId,
        count: users.length
      }
    });

  } catch (error) {
    logger.error('Error fetching tenant users:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * Exemplo de rota para criar usuário no tenant
 * POST /api/tenant-example/users
 */
router.post('/api/tenant-example/users',  async (req: RequestWithTenant, res: Response) => {
  try {
    // req.user já está populado pelo middleware requireAuth
    const authenticatedUser = req.user!;

    // 2. Obter PrismaClient do tenant
    const tenantId = getTenantIdFromRequest(req);
    const db = getTenantPrisma(tenantId);

    const { email, firstName, lastName, role = 'member' } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email, firstName and lastName are required' }
      });
    }

    // 3. Criar usuário no schema do tenant
    const user = await db.user.create({
      data: {
        tenantId,
        email,
        firstName,
        lastName,
        role,
        status: 'ACTIVE',
        // password removido - agora é gerenciado via Account
      }
    });

    logger.info(`Created user ${user.id} for tenant ${tenantId}`);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: authenticatedUser.name?.split(' ')[0] || '',
          lastName: authenticatedUser.name?.split(' ')[1] || '',
          role: authenticatedUser.role,
          status: 'ACTIVE',
          tenantId: user.tenantId
        }
      }
    });

  } catch (error) {
    logger.error('Error creating tenant user:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export { router as tenantExampleRoutes };
