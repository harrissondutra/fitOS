import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { TenantService } from '../services/tenant.service';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  customDomain?: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: Record<string, any>;
}

export interface RequestWithTenant extends Request {
  tenant?: Tenant;
}

const tenantService = TenantService.getInstance();

export const tenantMiddleware = async (
  req: RequestWithTenant,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip tenant resolution for health check endpoints
    if (req.path.startsWith('/api/health')) {
      next();
      return;
    }

    const host = req.get('host') || '';
    const tenantId = req.headers['x-tenant-id'] as string;
    
    let tenant: Tenant | null = null;

    // Try to resolve tenant by ID first (for API calls)
    if (tenantId) {
      tenant = await tenantService.resolveTenantById(tenantId);
    } else {
      // Try to resolve tenant by hostname
      tenant = await tenantService.resolveTenantByHost(host);
    }

    if (!tenant) {
      logger.warn('Tenant not found', { host, tenantId });
      res.status(404).json({
        success: false,
        error: {
          message: 'Tenant not found',
        },
      });
      return;
    }

    if (tenant.status !== 'active') {
      logger.warn('Tenant not active', { tenantId: tenant.id, status: tenant.status });
      res.status(403).json({
        success: false,
        error: {
          message: 'Tenant is not active',
        },
      });
      return;
    }

    // Attach tenant to request
    req.tenant = tenant;
    
    // Add tenant ID to response headers
    res.set('X-Tenant-ID', tenant.id);
    
    next();
  } catch (error) {
    logger.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
      },
    });
  }
};
