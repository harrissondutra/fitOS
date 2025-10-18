import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface RequestWithTenant extends Request {
  tenantId?: string;
}

/**
 * Resolve tenant ID baseado no host ou header
 */
function resolveTenantFromHost(host: string): string {
  // Exemplo: acme.fitos.com => "acme"
  // Para desenvolvimento local: localhost:3000 => "default"
  if (host.includes('localhost')) {
    return 'default';
  }
  
  const parts = host.split('.');
  if (parts.length > 2) {
    return parts[0]; // subdomain
  }
  
  return 'default';
}

export const tenantMiddleware = (
  req: RequestWithTenant,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Skip tenant resolution for health check endpoints and Better Auth
    if (req.path.startsWith('/api/health') || req.path.startsWith('/api/auth/')) {
      next();
      return;
    }

    const host = req.get('host') || '';
    const tenantIdFromHeader = req.headers['x-tenant-id'] as string;
    
    // Resolve tenant ID (prioriza header, depois host)
    const tenantId = tenantIdFromHeader || resolveTenantFromHost(host);
    
    // Validação básica do tenant ID
    if (!tenantId || tenantId.length < 1) {
      logger.warn('Invalid tenant ID', { host, tenantIdFromHeader });
      res.status(400).json({
        success: false,
        error: {
          message: 'Invalid tenant ID',
        },
      });
      return;
    }

    // Attach tenant ID to request
    req.tenantId = tenantId;
    
    // Add tenant ID to response headers
    res.set('X-Tenant-ID', tenantId);
    
    logger.debug('Tenant resolved', { tenantId, host });
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
