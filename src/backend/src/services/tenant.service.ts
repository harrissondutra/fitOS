import { PrismaClient } from '@prisma/client';

export class TenantService {
  constructor(private prisma: PrismaClient) {}

  async getTenantById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async resolveTenantById(id: string) {
    return this.getTenantById(id);
  }

  async resolveTenantByHost(host: string) {
    // Extract subdomain from host
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return this.prisma.tenant.findFirst({
        where: { subdomain },
      });
    }
    return null;
  }

  async listTenants(filters: any = {}) {
    const { status, plan, limit = 50, offset = 0 } = filters;
    
    const where: any = {};
    if (status) where.status = status;
    if (plan) where.plan = plan;

    const [tenants, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      tenants,
      total,
      limit,
      offset,
    };
  }

  async createTenant(data: any) {
    return this.prisma.tenant.create({
      data,
    });
  }

  async updateTenant(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async deleteTenant(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
}