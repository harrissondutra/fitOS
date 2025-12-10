import { Tenant, PlanConfig, TenantType, PlanLimits } from '../../../shared/types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId?: string;
      };
      tenant?: Tenant;
      tenantId?: string;
      prisma?: any;
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

export interface RequestWithTenant extends Request {
  tenant: Tenant;
  tenantId: string;
}

export interface RequestWithSchemaTenant extends Request {
  tenant: Tenant;
  prisma: any;
}
