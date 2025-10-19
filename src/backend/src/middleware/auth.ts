import { Request, Response, NextFunction } from 'express';
import auth from '../config/auth';

// Definir tipos localmente já que não são enums no Prisma
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'MEMBER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        tenantId?: string;
        name?: string;
      };
      tenantId?: string;
    }
  }
}

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Verificar sessão do Better Auth
    const session = await auth.api.getSession(req as any);
    
    if (!session) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Usuário não autenticado'
        }
      });
      return;
    }

    // Buscar dados completos do usuário
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Usuário não encontrado'
        }
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
      tenantId: user.tenantId || undefined,
      name: `${user.firstName} ${user.lastName}`
    };

    req.tenantId = user.tenantId || undefined;
    
    next();
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    res.status(401).json({
      success: false,
      error: {
        message: 'Usuário não autenticado'
      }
    });
  }
};

/**
 * Middleware para verificar se o usuário é admin
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Usuário não autenticado'
        }
      });
      return;
    }

    const allowedRoles: UserRole[] = ['ADMIN', 'OWNER', 'SUPER_ADMIN'];
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade'
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de admin:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao verificar permissões'
      }
    });
  }
};

/**
 * Middleware para verificar se o usuário é super admin
 */
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Usuário não autenticado'
        }
      });
      return;
    }

    if (req.user.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Acesso negado. Apenas super administradores podem acessar esta funcionalidade'
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao verificar permissões de super admin:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao verificar permissões'
      }
    });
  }
};

/**
 * Middleware para verificar acesso a recursos do tenant
 */
export const requireTenantAccess = (targetTenantId?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            message: 'Usuário não autenticado'
          }
        });
        return;
      }

      // SUPER_ADMIN pode acessar qualquer tenant
      if (req.user.role === 'SUPER_ADMIN') {
        next();
        return;
      }

      // ADMIN/OWNER só podem acessar seu próprio tenant
      const tenantId = targetTenantId || req.params.tenantId || req.query.tenantId as string;
      
      if (!tenantId || tenantId !== req.user.tenantId) {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado. Você só pode acessar recursos do seu próprio tenant'
          }
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Erro ao verificar acesso ao tenant:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Erro interno do servidor ao verificar acesso'
        }
      });
    }
  };
};
