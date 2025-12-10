/**
 * Nutrition Permissions Middleware - FitOS Sprint 4
 * 
 * Middleware específico para controle de acesso ao módulo nutricional
 * com separação clara entre profissionais e clientes.
 */

import { Request, Response, NextFunction } from 'express';
import { getPrismaClient } from '../config/database';
import { UserRoles, UserRole } from '../constants/roles';

const prisma = getPrismaClient();

// Interface para Request com usuário
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: any;
    tenantId?: string;
    name?: string;
  };
}

/**
 * Middleware para verificar acesso ao módulo nutricional profissional
 * Permite: SUPER_ADMIN, OWNER, ADMIN, NUTRITIONIST
 * Bloqueia: CLIENT, TRAINER (sem perfil nutricional)
 */
export const requireNutritionProfessionalAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userRole = req.user?.role;

  // Roles permitidos para acesso profissional
  const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'];

  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas nutricionistas e administradores podem acessar esta funcionalidade',
      requiredRoles: allowedRoles,
      userRole: userRole
    });
  }

  // Se for TRAINER, verificar se tem perfil nutricional
  if (userRole === 'TRAINER') {
    // TODO: Verificar se o trainer tem perfil nutricional ativo
    // Por enquanto, bloqueia TRAINERs sem perfil nutricional
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Trainers precisam ter perfil nutricional ativo para acessar esta funcionalidade'
    });
  }

  return next();
};

/**
 * Middleware para verificar acesso ao módulo nutricional do cliente
 * Permite: SUPER_ADMIN, OWNER, ADMIN, NUTRITIONIST, CLIENT
 * Bloqueia: TRAINER (sem perfil nutricional)
 */
export const requireNutritionClientAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const userRole = req.user?.role;

  // Todos os roles podem acessar funcionalidades do cliente
  // (profissionais para gerenciar, clientes para usar)
  const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST', 'CLIENT'];

  if (!userRole || !allowedRoles.includes(userRole)) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Acesso negado ao módulo nutricional',
      requiredRoles: allowedRoles,
      userRole: userRole
    });
  }

  return next();
};

/**
 * Middleware para verificar se o usuário pode gerenciar dados nutricionais de um cliente específico
 */
export const canManageNutritionClient = async (
  userId: string,
  clientId: string,
  userRole: UserRole,
  userTenantId: string
): Promise<boolean> => {
  try {
    // SUPER_ADMIN pode gerenciar qualquer cliente
    if (userRole === 'SUPER_ADMIN') return true;

    // OWNER e ADMIN podem gerenciar qualquer cliente do tenant
    if (['OWNER', 'ADMIN'].includes(userRole)) {
      const client = await prisma.nutritionClient.findUnique({
        where: { id: clientId },
        select: { tenantId: true }
      });
      return client?.tenantId === userTenantId;
    }

    // NUTRITIONIST pode gerenciar apenas seus clientes atribuídos
    if (userRole === 'NUTRITIONIST') {
      const client = await prisma.nutritionClient.findUnique({
        where: { id: clientId },
        select: {
          tenantId: true,
          nutritionistId: true
        }
      });
      return client?.tenantId === userTenantId && client?.nutritionistId === userId;
    }

    // CLIENT pode acessar apenas seus próprios dados
    if (userRole === 'CLIENT') {
      const client = await prisma.nutritionClient.findFirst({
        where: {
          userId: userId,
          tenantId: userTenantId
        },
        select: { id: true }
      });
      return client?.id === clientId;
    }

    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de gerenciamento nutricional:', error);
    return false;
  }
};

/**
 * Middleware para verificar acesso a recursos nutricionais específicos
 */
export const requireNutritionResourceAccess = (resourceType: 'meal-plan' | 'food-diary' | 'consultation' | 'goal' | 'exam') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userTenantId = req.user?.tenantId;

      if (!userId || !userRole || !userTenantId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // SUPER_ADMIN acessa tudo
      if (userRole === 'SUPER_ADMIN') {
        return next();
      }

      // OWNER e ADMIN acessam tudo do tenant
      if (['OWNER', 'ADMIN'].includes(userRole)) {
        const hasAccess = await checkTenantNutritionResource(resourceId, resourceType, userTenantId);
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado',
            message: `Recurso ${resourceType} não encontrado ou não pertence ao seu tenant`
          });
        }
        return next();
      }

      // NUTRITIONIST acessa recursos de seus clientes
      if (userRole === 'NUTRITIONIST') {
        const hasAccess = await checkNutritionistResourceAccess(resourceId, resourceType, userId, userTenantId);
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado',
            message: `Você não tem permissão para acessar este ${resourceType}`
          });
        }
        return next();
      }

      // CLIENT acessa apenas seus próprios recursos
      if (userRole === 'CLIENT') {
        const hasAccess = await checkClientNutritionResource(resourceId, resourceType, userId, userTenantId);
        if (!hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado',
            message: `Você não tem permissão para acessar este ${resourceType}`
          });
        }
        return next();
      }

      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Role não autorizado para acesso a recursos nutricionais'
      });

    } catch (error) {
      console.error('Erro no middleware de acesso a recurso nutricional:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

/**
 * Verifica se o recurso nutricional pertence ao tenant
 */
async function checkTenantNutritionResource(
  resourceId: string,
  resourceType: string,
  userTenantId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'meal-plan': {
        const mealPlan = await prisma.mealPlan.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return mealPlan?.tenantId === userTenantId;
      }

      case 'food-diary': {
        const diary = await prisma.foodDiaryEntry.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return diary?.tenantId === userTenantId;
      }

      case 'consultation': {
        const consultation = await prisma.nutritionConsultation.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return consultation?.tenantId === userTenantId;
      }

      case 'goal': {
        const goal = await prisma.nutritionGoal.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return goal?.tenantId === userTenantId;
      }

      case 'exam': {
        const exam = await prisma.laboratoryExam.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return exam?.tenantId === userTenantId;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao verificar recurso nutricional do tenant:', error);
    return false;
  }
}

/**
 * Verifica se o NUTRITIONIST pode acessar o recurso (de seus clientes)
 */
async function checkNutritionistResourceAccess(
  resourceId: string,
  resourceType: string,
  userId: string,
  userTenantId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'meal-plan': {
        const mealPlan = await prisma.mealPlan.findUnique({
          where: { id: resourceId },
          select: { nutritionistId: true, tenantId: true }
        });
        return mealPlan?.nutritionistId === userId && mealPlan?.tenantId === userTenantId;
      }

      case 'food-diary': {
        const diary = await prisma.foodDiaryEntry.findUnique({
          where: { id: resourceId },
          select: {
            tenantId: true,
            client: {
              select: { nutritionistId: true }
            }
          }
        });
        return diary?.client.nutritionistId === userId && diary?.tenantId === userTenantId;
      }

      case 'consultation': {
        const consultation = await prisma.nutritionConsultation.findUnique({
          where: { id: resourceId },
          select: { nutritionistId: true, tenantId: true }
        });
        return consultation?.nutritionistId === userId && consultation?.tenantId === userTenantId;
      }

      case 'goal': {
        const goal = await prisma.nutritionGoal.findUnique({
          where: { id: resourceId },
          select: {
            tenantId: true,
            client: {
              select: { nutritionistId: true }
            }
          }
        });
        return goal?.client.nutritionistId === userId && goal?.tenantId === userTenantId;
      }

      case 'exam': {
        const exam = await prisma.laboratoryExam.findUnique({
          where: { id: resourceId },
          select: {
            tenantId: true,
            clientId: true
          }
        });
        if (!exam) return false;

        // Verificar se o nutritionistId do client é o userId
        const client = await prisma.nutritionClient.findUnique({
          where: { id: exam.clientId },
          select: { nutritionistId: true }
        });
        return client?.nutritionistId === userId && exam?.tenantId === userTenantId;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao verificar acesso nutricional do profissional:', error);
    return false;
  }
}

/**
 * Verifica se o CLIENT pode acessar o recurso (apenas seus próprios dados)
 */
async function checkClientNutritionResource(
  resourceId: string,
  resourceType: string,
  userId: string,
  userTenantId: string
): Promise<boolean> {
  try {
    // Primeiro, verifica se o usuário tem um cliente nutricional associado
    const client = await prisma.nutritionClient.findFirst({
      where: {
        userId: userId,
        tenantId: userTenantId
      },
      select: { id: true }
    });

    if (!client) return false;

    switch (resourceType) {
      case 'meal-plan': {
        const mealPlan = await prisma.mealPlan.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        return mealPlan?.clientId === client.id && mealPlan?.tenantId === userTenantId;
      }

      case 'food-diary': {
        const diary = await prisma.foodDiaryEntry.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        return diary?.clientId === client.id && diary?.tenantId === userTenantId;
      }

      case 'consultation': {
        const consultation = await prisma.nutritionConsultation.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        return consultation?.clientId === client.id && consultation?.tenantId === userTenantId;
      }

      case 'goal': {
        const goal = await prisma.nutritionGoal.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        return goal?.clientId === client.id && goal?.tenantId === userTenantId;
      }

      case 'exam': {
        const exam = await prisma.laboratoryExam.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        return exam?.clientId === client.id && exam?.tenantId === userTenantId;
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao verificar acesso nutricional do cliente:', error);
    return false;
  }
}

/**
 * Middleware para verificar se o usuário pode criar recursos nutricionais para um cliente específico
 */
export const canCreateNutritionForClient = async (
  userId: string,
  clientId: string,
  userRole: UserRole,
  userTenantId: string
): Promise<boolean> => {
  try {
    // SUPER_ADMIN pode criar para qualquer cliente
    if (userRole === 'SUPER_ADMIN') return true;

    // OWNER e ADMIN podem criar para qualquer cliente do tenant
    if (['OWNER', 'ADMIN'].includes(userRole)) {
      const client = await prisma.nutritionClient.findUnique({
        where: { id: clientId },
        select: { tenantId: true }
      });
      return client?.tenantId === userTenantId;
    }

    // NUTRITIONIST pode criar apenas para seus clientes atribuídos
    if (userRole === 'NUTRITIONIST') {
      const client = await prisma.nutritionClient.findUnique({
        where: { id: clientId },
        select: {
          tenantId: true,
          nutritionistId: true
        }
      });
      return client?.tenantId === userTenantId && client?.nutritionistId === userId;
    }

    // CLIENT não pode criar recursos para outros clientes
    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de criação nutricional para cliente:', error);
    return false;
  }
};

/**
 * Utilitário para verificar se o usuário pode gerenciar nutrição
 */
export const canManageNutrition = (userRole?: UserRole): boolean => {
  return ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'].includes(userRole || '');
};

/**
 * Utilitário para verificar se o usuário é nutricionista
 */
export const isNutritionist = (userRole?: UserRole): boolean => {
  return userRole === 'NUTRITIONIST';
};

export default {
  requireNutritionProfessionalAccess,
  requireNutritionClientAccess,
  canManageNutritionClient,
  requireNutritionResourceAccess,
  canCreateNutritionForClient,
  canManageNutrition,
  isNutritionist
};

