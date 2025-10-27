import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'NUTRITIONIST' | 'CLIENT';

export interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: {
    id: string;
    email: string;
    role: UserRole;
    tenantId?: string;
    name?: string;
  };
}

export const validateClientScope = (req: RequestWithTenant, res: Response, next: NextFunction) => {
  if (req.user?.role === 'CLIENT' && req.params.clientId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: You can only access your own client data.' });
  }
  return next();
};

export const validateTrainerScope = (prisma: PrismaClient) => {
  return async (req: RequestWithTenant, res: Response, next: NextFunction) => {
    if (req.user?.role === 'TRAINER' && req.params.clientId) {
      const assignment = await prisma.clientTrainer.findMany({
        where: {
          clientId: req.params.clientId,
          trainerId: req.user.id,
        },
      });

      if (assignment.length === 0) {
        return res.status(403).json({ message: 'Forbidden: You can only access clients assigned to you.' });
      }
    }
    return next();
  };
};
