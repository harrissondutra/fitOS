import { Request, Response, NextFunction } from 'express';
import { PlanLimitsService } from '../services/plan-limits.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const planLimitsService = new PlanLimitsService(prisma);

// Extend Request interface to include tenantId
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      userLimitInfo?: any;
    }
  }
}

/**
 * Middleware para validar se um usuário pode ser criado com a role especificada
 * baseado nos limites do plano do tenant
 */
export const validateUserLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant ID não encontrado na requisição'
        }
      });
      return;
    }

    if (!role) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Role é obrigatória'
        }
      });
      return;
    }

    const limitCheck = await planLimitsService.checkUserLimit(tenantId, role);

    if (!limitCheck.allowed) {
      res.status(403).json({
        success: false,
        error: {
          message: `Limite de ${role} excedido`,
          details: {
            current: limitCheck.current,
            limit: limitCheck.limit,
            available: limitCheck.available
          }
        }
      });
      return;
    }

    // Adicionar informações de limite ao request para uso posterior
    req.userLimitInfo = limitCheck;
    next();
  } catch (error) {
    console.error('Erro ao validar limite de usuário:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao validar limite'
      }
    });
  }
};

/**
 * Middleware para validar acesso via subdomain
 */
export const validateSubdomainAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;
    const host = req.get('host');

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant ID não encontrado na requisição'
        }
      });
      return;
    }

    // Buscar tenant para verificar subdomain
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subdomain: true, tenantType: true }
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Tenant não encontrado'
        }
      });
      return;
    }

    // Se é pessoa física, não precisa de subdomain
    if (tenant.tenantType === 'individual') {
      next();
      return;
    }

    // Se é business, deve ter subdomain
    if (tenant.tenantType === 'business' && !tenant.subdomain) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant business deve ter subdomain configurado'
        }
      });
      return;
    }

    // Verificar se o host corresponde ao subdomain
    if (tenant.subdomain && host && !host.includes(tenant.subdomain)) {
      res.status(403).json({
        success: false,
        error: {
          message: 'Acesso negado via subdomain incorreto'
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao validar acesso via subdomain:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao validar subdomain'
      }
    });
  }
};

/**
 * Middleware para validar conversão de individual para business
 */
export const validateBusinessConversion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant ID não encontrado na requisição'
        }
      });
      return;
    }

    // Buscar tenant para verificar tipo atual
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { 
        tenantType: true, 
        subdomain: true,
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Tenant não encontrado'
        }
      });
      return;
    }

    // Só permite conversão se for individual
    if (tenant.tenantType !== 'individual') {
      res.status(400).json({
        success: false,
        error: {
          message: 'Apenas tenants individuais podem ser convertidos para business'
        }
      });
      return;
    }

    // Verificar se já tem subdomain (já foi convertido)
    if (tenant.subdomain) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant já foi convertido para business'
        }
      });
      return;
    }

    // Verificar se tem mais de 1 usuário (não deveria acontecer para individual)
    if (tenant._count.users > 1) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Tenant individual não pode ter mais de 1 usuário'
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erro ao validar conversão para business:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Erro interno do servidor ao validar conversão'
      }
    });
  }
};
