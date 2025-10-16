import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { Tenant } from '../middleware/tenant';

export class TenantService {
  private static instance: TenantService;
  private tenantCache = new Map<string, Tenant>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  async resolveTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      // Check cache first
      const cached = this.getCachedTenant(tenantId);
      if (cached) {
        return cached;
      }

      const prisma = getPrismaClient();
      
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          status: true,
          settings: true,
          plan: true,
          billingEmail: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!tenant) {
        return null;
      }

      const tenantData: Tenant = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || undefined,
        status: tenant.status as 'active' | 'inactive' | 'suspended',
        settings: tenant.settings as Record<string, any>,
      };

      // Cache the result
      this.setCachedTenant(tenantId, tenantData);

      return tenantData;
    } catch (error) {
      logger.error('Error resolving tenant by ID:', error);
      return null;
    }
  }

  async resolveTenantByHost(host: string): Promise<Tenant | null> {
    try {
      // Check cache first
      const cached = this.getCachedTenant(host);
      if (cached) {
        return cached;
      }

      const prisma = getPrismaClient();
      
      // Check for custom domain first
      let tenant = await prisma.tenant.findFirst({
        where: {
          customDomain: host,
          status: 'active',
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          status: true,
          settings: true,
          plan: true,
          billingEmail: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // If not found, check for subdomain
      if (!tenant) {
        const subdomain = this.extractSubdomain(host);
        if (subdomain) {
          tenant = await prisma.tenant.findFirst({
            where: {
              subdomain: subdomain,
              status: 'active',
            },
            select: {
              id: true,
              name: true,
              subdomain: true,
              customDomain: true,
              status: true,
              settings: true,
              plan: true,
              billingEmail: true,
              createdAt: true,
              updatedAt: true,
            },
          });
        }
      }

      if (!tenant) {
        return null;
      }

      const tenantData: Tenant = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || undefined,
        status: tenant.status as 'active' | 'inactive' | 'suspended',
        settings: tenant.settings as Record<string, any>,
      };

      // Cache the result
      this.setCachedTenant(host, tenantData);

      return tenantData;
    } catch (error) {
      logger.error('Error resolving tenant by host:', error);
      return null;
    }
  }

  async createTenant(tenantData: {
    name: string;
    subdomain: string;
    customDomain?: string;
    billingEmail: string;
    plan?: string;
    settings?: Record<string, any>;
  }): Promise<Tenant | null> {
    try {
      const prisma = getPrismaClient();

      // Check if subdomain already exists
      const existingSubdomain = await prisma.tenant.findUnique({
        where: { subdomain: tenantData.subdomain },
      });

      if (existingSubdomain) {
        throw new Error('Subdomain already exists');
      }

      // Check if custom domain already exists
      if (tenantData.customDomain) {
        const existingDomain = await prisma.tenant.findUnique({
          where: { customDomain: tenantData.customDomain },
        });

        if (existingDomain) {
          throw new Error('Custom domain already exists');
        }
      }

      const tenant = await prisma.tenant.create({
        data: {
          name: tenantData.name,
          subdomain: tenantData.subdomain,
          customDomain: tenantData.customDomain,
          billingEmail: tenantData.billingEmail,
          plan: tenantData.plan || 'starter',
          status: 'active',
          settings: tenantData.settings || {},
        },
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          status: true,
          settings: true,
          plan: true,
          billingEmail: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const result: Tenant = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || undefined,
        status: tenant.status as 'active' | 'inactive' | 'suspended',
        settings: tenant.settings as Record<string, any>,
      };

      // Cache the result
      this.setCachedTenant(tenant.id, result);
      this.setCachedTenant(tenant.subdomain, result);
      if (tenant.customDomain) {
        this.setCachedTenant(tenant.customDomain, result);
      }

      logger.info('Tenant created successfully', {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain,
      });

      return result;
    } catch (error) {
      logger.error('Error creating tenant:', error);
      throw error;
    }
  }

  async updateTenant(tenantId: string, updates: Partial<{
    name: string;
    subdomain: string;
    customDomain: string;
    status: 'active' | 'inactive' | 'suspended';
    settings: Record<string, any>;
    plan: string;
  }>): Promise<Tenant | null> {
    try {
      const prisma = getPrismaClient();

      // Check if subdomain already exists (if updating subdomain)
      if (updates.subdomain) {
        const existingSubdomain = await prisma.tenant.findFirst({
          where: {
            subdomain: updates.subdomain,
            id: { not: tenantId },
          },
        });

        if (existingSubdomain) {
          throw new Error('Subdomain already exists');
        }
      }

      // Check if custom domain already exists (if updating custom domain)
      if (updates.customDomain) {
        const existingDomain = await prisma.tenant.findFirst({
          where: {
            customDomain: updates.customDomain,
            id: { not: tenantId },
          },
        });

        if (existingDomain) {
          throw new Error('Custom domain already exists');
        }
      }

      const tenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: updates,
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          status: true,
          settings: true,
          plan: true,
          billingEmail: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const result: Tenant = {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || undefined,
        status: tenant.status as 'active' | 'inactive' | 'suspended',
        settings: tenant.settings as Record<string, any>,
      };

      // Update cache
      this.setCachedTenant(tenant.id, result);
      this.setCachedTenant(tenant.subdomain, result);
      if (tenant.customDomain) {
        this.setCachedTenant(tenant.customDomain, result);
      }

      logger.info('Tenant updated successfully', {
        tenantId: tenant.id,
        updates,
      });

      return result;
    } catch (error) {
      logger.error('Error updating tenant:', error);
      throw error;
    }
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    try {
      const prisma = getPrismaClient();

      // Soft delete - set status to inactive
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { status: 'inactive' },
      });

      // Clear cache
      this.clearTenantCache(tenantId);

      logger.info('Tenant deleted successfully', { tenantId });
      return true;
    } catch (error) {
      logger.error('Error deleting tenant:', error);
      throw error;
    }
  }

  async listTenants(filters?: {
    status?: 'active' | 'inactive' | 'suspended';
    plan?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ tenants: Tenant[]; total: number }> {
    try {
      const prisma = getPrismaClient();

      const where = {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.plan && { plan: filters.plan }),
      };

      const [tenants, total] = await Promise.all([
        prisma.tenant.findMany({
          where,
          select: {
            id: true,
            name: true,
            subdomain: true,
            customDomain: true,
            status: true,
            settings: true,
            plan: true,
            billingEmail: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: filters?.limit || 50,
          skip: filters?.offset || 0,
        }),
        prisma.tenant.count({ where }),
      ]);

      const result: Tenant[] = tenants.map((tenant: any) => ({
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || undefined,
        status: tenant.status as 'active' | 'inactive' | 'suspended',
        settings: tenant.settings as Record<string, any>,
      }));

      return { tenants: result, total };
    } catch (error) {
      logger.error('Error listing tenants:', error);
      throw error;
    }
  }

  private extractSubdomain(host: string): string | null {
    // Remove port if present
    const hostname = host.split(':')[0];
    
    // Check if it's a subdomain of localhost (development)
    if (hostname.endsWith('.localhost')) {
      return hostname.replace('.localhost', '');
    }
    
    // Check if it's a subdomain of the production domain
    if (hostname.endsWith('.fitos.com')) {
      return hostname.replace('.fitos.com', '');
    }
    
    // Check if it's a subdomain of the staging domain
    if (hostname.endsWith('.staging.fitos.com')) {
      return hostname.replace('.staging.fitos.com', '');
    }
    
    return null;
  }

  private getCachedTenant(key: string): Tenant | null {
    const cached = this.tenantCache.get(key);
    const expiry = this.cacheExpiry.get(key);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Remove expired cache
    if (expiry && Date.now() >= expiry) {
      this.tenantCache.delete(key);
      this.cacheExpiry.delete(key);
    }
    
    return null;
  }

  private setCachedTenant(key: string, tenant: Tenant): void {
    this.tenantCache.set(key, tenant);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  private clearTenantCache(tenantId: string): void {
    // Clear all cache entries for this tenant
    for (const [key, tenant] of this.tenantCache.entries()) {
      if (tenant.id === tenantId) {
        this.tenantCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }

  // Clear all cache (useful for testing)
  clearAllCache(): void {
    this.tenantCache.clear();
    this.cacheExpiry.clear();
  }
}
