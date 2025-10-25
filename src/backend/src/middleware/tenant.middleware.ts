import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface RequestWithTenant extends Request {
  tenantId?: string;
}

export const tenantMiddleware = (req: RequestWithTenant, res: Response, next: NextFunction) => {
  let tenantId: string | undefined;

  // Try to extract tenant ID from different sources
  if (req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'] as string;
  } else if (req.query.tenant) {
    tenantId = req.query.tenant as string;
  } else if (req.headers.host) {
    // Extract from subdomain (e.g., tenant1.example.com -> tenant1)
    const host = req.headers.host as string;
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      tenantId = subdomain;
    }
  }

  if (!tenantId) {
    logger.warn('No tenant ID found in request', {
      headers: req.headers,
      query: req.query,
      host: req.headers.host,
    });
    return res.status(400).json({
      message: 'Tenant ID is required',
    });
  }

  req.tenantId = tenantId;
  return next();
};
