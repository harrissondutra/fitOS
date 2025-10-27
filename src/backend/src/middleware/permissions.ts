import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Tipos de roles
export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'NUTRITIONIST' | 'CLIENT';

// Interface para Request com usuário
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
  userId?: string;
  tenantId?: string;
  userRole?: UserRole;
}

/**
 * Middleware para verificar se o usuário tem uma das roles permitidas
 * SUPER_ADMIN sempre tem acesso total
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    // SUPER_ADMIN sempre tem acesso total
    if (userRole === 'SUPER_ADMIN') {
      return next();
    }
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        message: `Role '${userRole}' não tem permissão para esta operação`,
        requiredRoles: allowedRoles
      });
    }
    
    next();
  };
};

/**
 * Verifica se o usuário pode acessar um recurso específico
 * Considera permissões por role e ownership
 */
export const canAccessResource = async (
  userId: string,
  resourceId: string,
  resourceType: 'appointment' | 'client' | 'crm_client' | 'bioimpedance' | 'template' | 'availability',
  userRole: UserRole,
  userTenantId: string
): Promise<boolean> => {
  try {
    // SUPER_ADMIN acessa tudo
    if (userRole === 'SUPER_ADMIN') return true;
    
    // OWNER e ADMIN acessam tudo do tenant
    if (['OWNER', 'ADMIN'].includes(userRole)) {
      return await checkTenantOwnership(resourceId, resourceType, userTenantId);
    }
    
    // TRAINER acessa apenas seus recursos
    if (userRole === 'TRAINER') {
      return await checkTrainerOwnership(resourceId, resourceType, userId, userTenantId);
    }
    
    // CLIENT acessa apenas seus próprios dados
    if (userRole === 'CLIENT') {
      return await checkClientOwnership(resourceId, resourceType, userId, userTenantId);
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de acesso:', error);
    return false;
  }
};

/**
 * Verifica se o recurso pertence ao tenant do usuário
 */
async function checkTenantOwnership(
  resourceId: string, 
  resourceType: string, 
  userTenantId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'appointment': {
        const appointment = await prisma.appointment.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return appointment?.tenantId === userTenantId;
      }
        
      case 'client': {
        const client = await prisma.client.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return client?.tenantId === userTenantId;
      }
        
      case 'crm_client': {
        const clientProfile = await prisma.clientProfile.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return clientProfile?.tenantId === userTenantId;
      }
        
      case 'bioimpedance': {
        const biometric = await prisma.biometricData.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return biometric?.tenantId === userTenantId;
      }
        
      case 'template': {
        const template = await prisma.appointmentTemplate.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return template?.tenantId === userTenantId;
      }
        
      case 'availability': {
        const availability = await prisma.professionalAvailability.findUnique({
          where: { id: resourceId },
          select: { tenantId: true }
        });
        return availability?.tenantId === userTenantId;
      }
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao verificar ownership do tenant:', error);
    return false;
  }
}

/**
 * Verifica se o TRAINER pode acessar o recurso (seus clientes/agendamentos)
 */
async function checkTrainerOwnership(
  resourceId: string,
  resourceType: string,
  userId: string,
  userTenantId: string
): Promise<boolean> {
  try {
    switch (resourceType) {
      case 'appointment': {
        const appointment = await prisma.appointment.findUnique({
          where: { id: resourceId },
          select: { professionalId: true, tenantId: true }
        });
        return appointment?.professionalId === userId && appointment?.tenantId === userTenantId;
      }
        
      case 'client': {
        // Verifica se o cliente está atribuído ao trainer
        const clientTrainer = await prisma.clientTrainer.findFirst({
          where: {
            clientId: resourceId,
            trainerId: userId
          }
        });
        return !!clientTrainer;
      }
        
      case 'crm_client': {
        const client = await prisma.clientProfile.findUnique({
          where: { id: resourceId },
          select: { professionalId: true, tenantId: true }
        });
        return client?.professionalId === userId && client?.tenantId === userTenantId;
      }
        
      case 'bioimpedance': {
        // Verifica se a medição é de um membro atribuído ao trainer
        const biometric = await prisma.biometricData.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        
        if (!biometric) return false;
        
        const clientTrainerRelation = await prisma.clientTrainer.findFirst({
          where: {
            clientId: biometric.clientId,
            trainerId: userId
          }
        });
        return !!clientTrainerRelation;
      }
        
      case 'template': {
        const template = await prisma.appointmentTemplate.findUnique({
          where: { id: resourceId },
          select: { professionalId: true, tenantId: true }
        });
        return template?.professionalId === userId && template?.tenantId === userTenantId;
      }
        
      case 'availability': {
        const availability = await prisma.professionalAvailability.findUnique({
          where: { id: resourceId },
          select: { professionalId: true, tenantId: true }
        });
        return availability?.professionalId === userId && availability?.tenantId === userTenantId;
      }
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao verificar ownership do trainer:', error);
    return false;
  }
}

/**
 * Verifica se o CLIENT pode acessar o recurso (apenas seus próprios dados)
 */
async function checkClientOwnership(
  resourceId: string,
  resourceType: string,
  userId: string,
  userTenantId: string
): Promise<boolean> {
  try {
    // Primeiro, verifica se o usuário tem um cliente associado
    const client = await prisma.client.findFirst({
      where: {
        userId: userId,
        tenantId: userTenantId
      },
      select: { id: true }
    });
    
    if (!client) return false;
    
    switch (resourceType) {
      case 'appointment': {
        const appointment = await prisma.appointment.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        return appointment?.clientId === client.id && appointment?.tenantId === userTenantId;
      }
        
      case 'client':
        return resourceId === client.id;
        
      case 'bioimpedance': {
        const biometric = await prisma.biometricData.findUnique({
          where: { id: resourceId },
          select: { clientId: true, tenantId: true }
        });
        return biometric?.clientId === client.id && biometric?.tenantId === userTenantId;
      }
        
      case 'crm_client':
        // Client não pode acessar dados de CRM
        return false;
        
      case 'template':
        // Client não pode acessar templates
        return false;
        
      case 'availability':
        // Client não pode acessar disponibilidade
        return false;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Erro ao verificar ownership do client:', error);
    return false;
  }
}

/**
 * Middleware para verificar acesso a recursos específicos
 */
export const requireResourceAccess = (resourceType: 'appointment' | 'client' | 'crm_client' | 'bioimpedance' | 'template' | 'availability') => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const userTenantId = req.user?.tenantId;
      
      if (!userId || !userRole || !userTenantId) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      const hasAccess = await canAccessResource(
        userId,
        resourceId,
        resourceType,
        userRole,
        userTenantId
      );
      
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Acesso negado',
          message: `Você não tem permissão para acessar este ${resourceType}`
        });
      }
      
      return next();
    } catch (error) {
      console.error('Erro no middleware de acesso a recurso:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

/**
 * Middleware para verificar se o usuário pode criar recursos para um cliente específico
 */
export const canCreateForClient = async (
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
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { tenantId: true }
      });
      return client?.tenantId === userTenantId;
    }
    
    // TRAINER pode criar apenas para seus clientes atribuídos
    if (userRole === 'TRAINER') {
      const clientTrainer = await prisma.clientTrainer.findFirst({
        where: {
          clientId: clientId,
          trainerId: userId
        }
      });
      return !!clientTrainer;
    }
    
    // CLIENT não pode criar recursos para outros clientes
    return false;
  } catch (error) {
    console.error('Erro ao verificar permissão de criação para cliente:', error);
    return false;
  }
};

/**
 * Middleware para verificar permissões de Google Calendar (apenas CLIENT)
 */
export const requireGoogleCalendarAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  
  if (userRole !== 'CLIENT') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas clientes podem conectar Google Calendar'
    });
  }
  
  return next();
};

/**
 * Middleware para verificar permissões de CRM (não CLIENT)
 */
export const requireCRMAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  
  if (userRole === 'CLIENT') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Clientes não podem acessar funcionalidades de CRM'
    });
  }
  
  return next();
};

/**
 * Middleware para verificar permissões de campanhas (apenas OWNER/ADMIN)
 */
export const requireCampaignAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  
  if (!userRole || !['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(userRole)) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas OWNER e ADMIN podem gerenciar campanhas'
    });
  }
  
  return next();
};

/**
 * Utilitário para verificar se o usuário é SUPER_ADMIN
 */
export const isSuperAdmin = (userRole?: UserRole): boolean => {
  return userRole === 'SUPER_ADMIN';
};

/**
 * Utilitário para verificar se o usuário pode gerenciar o tenant
 */
export const canManageTenant = (userRole?: UserRole): boolean => {
  return ['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(userRole || '');
};

/**
 * Utilitário para verificar se o usuário pode gerenciar clientes
 */
export const canManageClients = (userRole?: UserRole): boolean => {
  return ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'].includes(userRole || '');
};

export default {
  requireRole,
  canAccessResource,
  requireResourceAccess,
  canCreateForClient,
  requireGoogleCalendarAccess,
  requireCRMAccess,
  requireCampaignAccess,
  isSuperAdmin,
  canManageTenant,
  canManageClients
};
