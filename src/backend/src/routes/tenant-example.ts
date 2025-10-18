import { Router, Request, Response } from 'express';
import auth from '../config/auth';
import { getTenantPrisma, getTenantIdFromRequest } from '../lib/prisma-tenant';
import { RequestWithTenant } from '../middleware/tenant';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Exemplo de rota que usa PrismaClient por tenant
 * GET /api/tenant-example/users
 */
router.get('/api/tenant-example/users', async (req: RequestWithTenant, res: Response) => {
  try {
    // 1. Verificar sessão do Better Auth (global)
    const session = await auth.api.getSession(req as any);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // 2. Obter PrismaClient do tenant
    const tenantId = getTenantIdFromRequest(req);
    const db = getTenantPrisma(tenantId);

    // 3. Buscar dados no schema do tenant
    const users = await db.fitOSUser.findMany({
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
router.post('/api/tenant-example/users', async (req: RequestWithTenant, res: Response) => {
  try {
    // 1. Verificar sessão do Better Auth (global)
    const session = await auth.api.getSession(req as any);
    if (!session) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

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
    const user = await db.fitOSUser.create({
      data: {
        tenantId,
        email,
        firstName,
        lastName,
        role,
        status: 'ACTIVE',
        password: 'temp-password' // Em produção, gerar senha segura
      }
    });

    logger.info(`Created user ${user.id} for tenant ${tenantId}`);

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
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
