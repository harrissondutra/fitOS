import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRole } from './auth';

const prisma = new PrismaClient();

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
      superAdmin?: {
        id: string;
        role: string;
      };
      adminInfo?: {
        id: string;
        role: string;
        tenantId: string | null;
        isSuperAdmin: boolean;
      };
    }
  }
}

/**
 * Middleware para verificar se o usuário é super admin
 */
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Usuário não autenticado'
        }
      });
      return;
    }

    // Buscar usuário no banco para verificar role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        tenantId: true,
        status: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Usuário não encontrado'
        }
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Usuário inativo'
        }
      });
      return;
    }

    // Super admin não pertence a nenhum tenant (tenantId = null)
    // e tem role 'SUPER_ADMIN'
    if (user.role !== 'SUPER_ADMIN' || user.tenantId !== null) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Acesso negado. Apenas super administradores podem acessar esta funcionalidade',
          details: {
            userRole: user.role,
            hasTenant: user.tenantId !== null
          }
        }
      });
      return;
    }

    // Adicionar informações do super admin ao request
    req.superAdmin = {
      id: userId,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar super admin:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao verificar permissões'
      }
    });
  }
};

/**
 * Middleware para verificar se o usuário é admin ou super admin
 */
export const requireAdminOrSuperAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Usuário não autenticado'
        }
      });
      return;
    }

    // Buscar usuário no banco para verificar role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        role: true, 
        tenantId: true,
        status: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Usuário não encontrado'
        }
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: {
          message: 'Usuário inativo'
        }
      });
      return;
    }

    // Verificar se é super admin ou admin/owner
    const isSuperAdmin = user.role === 'SUPER_ADMIN' && user.tenantId === null;
    const isAdmin = user.role && ['ADMIN', 'OWNER'].includes(user.role) && user.tenantId !== null;

    if (!isSuperAdmin && !isAdmin) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade',
          details: {
            userRole: user.role,
            hasTenant: user.tenantId !== null
          }
        }
      });
      return;
    }

    // Adicionar informações do admin ao request
    req.adminInfo = {
      id: userId,
      role: user.role || 'MEMBER',
      tenantId: user.tenantId,
      isSuperAdmin
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao verificar permissões'
      }
    });
  }
};

/**
 * Middleware para verificar se o usuário pode gerenciar um tenant específico
 */
export const requireTenantAccess = (tenantIdParam: string = 'tenantId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const targetTenantId = req.params[tenantIdParam];

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Usuário não autenticado'
          }
        });
      }

      if (!targetTenantId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'ID do tenant é obrigatório'
          }
        });
      }

      // Buscar usuário no banco para verificar role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          role: true, 
          tenantId: true,
          status: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Usuário não encontrado'
          }
        });
      }

      if (user.status !== 'ACTIVE') {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Usuário inativo'
          }
        });
      }

      // Super admin pode acessar qualquer tenant
      if (user.role === 'SUPER_ADMIN' && user.tenantId === null) {
        req.adminInfo = {
          id: userId,
          role: user.role || 'MEMBER',
          tenantId: null,
          isSuperAdmin: true
        };
        return next();
      }

      // Admin/Owner só pode acessar seu próprio tenant
      if (user.role && ['ADMIN', 'OWNER'].includes(user.role) && user.tenantId === targetTenantId) {
        req.adminInfo = {
          id: userId,
          role: user.role || 'MEMBER',
          tenantId: user.tenantId,
          isSuperAdmin: false
        };
        return next();
      }

      return res.status(403).json({
        success: false,
        error: {
          message: 'Acesso negado. Você não tem permissão para acessar este tenant',
          details: {
            userRole: user.role,
            userTenantId: user.tenantId,
            targetTenantId
          }
        }
      });
    } catch (error) {
      console.error('Erro ao verificar acesso ao tenant:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erro interno do servidor ao verificar permissões'
        }
      });
    }
  };
};

// Extend Request interface to include admin information
declare global {
  namespace Express {
    interface Request {
      superAdmin?: {
        id: string;
        role: string;
      };
      adminInfo?: {
        id: string;
        role: string;
        tenantId: string | null;
        isSuperAdmin: boolean;
      };
    }
  }
}
