import { TenantService } from '../../services/tenant.service';

// Mock Prisma Client
const mockPrisma = {
  tenant: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('TenantService', () => {
  let tenantService: TenantService;

  beforeEach(() => {
    tenantService = new TenantService(mockPrisma as any);
    jest.clearAllMocks();
  });

  it('should create a tenant', async () => {
    const tenantData = {
      name: 'Test Tenant',
      plan: 'premium',
      tenantType: 'business',
      status: 'active',
    };

    const mockTenant = { id: 'tenant-1', ...tenantData };
    mockPrisma.tenant.create.mockResolvedValue(mockTenant);

    const tenant = await tenantService.createTenant(tenantData);
    
    expect(tenant).toHaveProperty('id');
    expect(tenant.name).toBe('Test Tenant');
    expect(tenant.plan).toBe('premium');
  });

  it('should get a tenant by id', async () => {
    const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
    mockPrisma.tenant.findUnique.mockResolvedValue(mockTenant);
    
    const foundTenant = await tenantService.getTenantById('tenant-1');
    
    expect(foundTenant).toBeTruthy();
    expect(foundTenant?.id).toBe('tenant-1');
  });

  it('should update a tenant', async () => {
    const updatedTenant = { id: 'tenant-1', name: 'Updated Tenant Name' };
    mockPrisma.tenant.update.mockResolvedValue(updatedTenant);
    
    const result = await tenantService.updateTenant('tenant-1', {
      name: 'Updated Tenant Name',
    });
    
    expect(result.name).toBe('Updated Tenant Name');
  });

  it('should delete a tenant', async () => {
    const mockTenant = { id: 'tenant-1', name: 'Test Tenant' };
    mockPrisma.tenant.delete.mockResolvedValue(mockTenant);
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    
    await tenantService.deleteTenant('tenant-1');
    
    const deletedTenant = await tenantService.getTenantById('tenant-1');
    expect(deletedTenant).toBeNull();
  });
});