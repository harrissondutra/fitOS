import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TenantService } from '../services/tenant.service';
import { setupTestDatabase, cleanupTestDatabase, getTestPrisma, createTestTenant } from './setup';

describe('TenantService', () => {
  let tenantService: TenantService;

  beforeEach(async () => {
    await setupTestDatabase();
    tenantService = TenantService.getInstance();
    tenantService.clearAllCache();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('createTenant', () => {
    it('should create a new tenant successfully', async () => {
      const tenantData = {
        name: 'Test Gym',
        subdomain: 'test-gym',
        billingEmail: 'test@gym.com',
        plan: 'starter',
        settings: { theme: 'dark' },
      };

      const tenant = await tenantService.createTenant(tenantData);

      expect(tenant).toBeDefined();
      expect(tenant?.name).toBe(tenantData.name);
      expect(tenant?.subdomain).toBe(tenantData.subdomain);
      expect(tenant?.status).toBe('active');
      expect(tenant?.settings).toEqual(tenantData.settings);
    });

    it('should throw error if subdomain already exists', async () => {
      // Create first tenant
      await createTestTenant({ subdomain: 'existing-gym' });

      const tenantData = {
        name: 'Another Gym',
        subdomain: 'existing-gym', // Same subdomain
        billingEmail: 'another@gym.com',
      };

      await expect(tenantService.createTenant(tenantData)).rejects.toThrow('Subdomain already exists');
    });

    it('should throw error if custom domain already exists', async () => {
      // Create first tenant
      await createTestTenant({ customDomain: 'existing.com' });

      const tenantData = {
        name: 'Another Gym',
        subdomain: 'another-gym',
        customDomain: 'existing.com', // Same custom domain
        billingEmail: 'another@gym.com',
      };

      await expect(tenantService.createTenant(tenantData)).rejects.toThrow('Custom domain already exists');
    });
  });

  describe('resolveTenantById', () => {
    it('should resolve tenant by ID', async () => {
      const createdTenant = await createTestTenant();
      const tenant = await tenantService.resolveTenantById(createdTenant.id);

      expect(tenant).toBeDefined();
      expect(tenant?.id).toBe(createdTenant.id);
      expect(tenant?.name).toBe(createdTenant.name);
    });

    it('should return null for non-existent tenant', async () => {
      const tenant = await tenantService.resolveTenantById('non-existent-id');
      expect(tenant).toBeNull();
    });

    it('should use cache for subsequent requests', async () => {
      const createdTenant = await createTestTenant();
      
      // First call
      const tenant1 = await tenantService.resolveTenantById(createdTenant.id);
      expect(tenant1).toBeDefined();

      // Second call should use cache
      const tenant2 = await tenantService.resolveTenantById(createdTenant.id);
      expect(tenant2).toBeDefined();
      expect(tenant1).toEqual(tenant2);
    });
  });

  describe('resolveTenantByHost', () => {
    it('should resolve tenant by custom domain', async () => {
      const createdTenant = await createTestTenant({ customDomain: 'test-gym.com' });
      const tenant = await tenantService.resolveTenantByHost('test-gym.com');

      expect(tenant).toBeDefined();
      expect(tenant?.id).toBe(createdTenant.id);
      expect(tenant?.customDomain).toBe('test-gym.com');
    });

    it('should resolve tenant by subdomain', async () => {
      const createdTenant = await createTestTenant({ subdomain: 'test-gym' });
      const tenant = await tenantService.resolveTenantByHost('test-gym.localhost');

      expect(tenant).toBeDefined();
      expect(tenant?.id).toBe(createdTenant.id);
      expect(tenant?.subdomain).toBe('test-gym');
    });

    it('should return null for non-existent host', async () => {
      const tenant = await tenantService.resolveTenantByHost('non-existent.localhost');
      expect(tenant).toBeNull();
    });

    it('should not return inactive tenants', async () => {
      await createTestTenant({ 
        subdomain: 'inactive-gym',
        status: 'inactive'
      });
      
      const tenant = await tenantService.resolveTenantByHost('inactive-gym.localhost');
      expect(tenant).toBeNull();
    });
  });

  describe('updateTenant', () => {
    it('should update tenant successfully', async () => {
      const createdTenant = await createTestTenant();
      
      const updates = {
        name: 'Updated Gym Name',
        settings: { theme: 'light' },
      };

      const updatedTenant = await tenantService.updateTenant(createdTenant.id, updates);

      expect(updatedTenant).toBeDefined();
      expect(updatedTenant?.name).toBe(updates.name);
      expect(updatedTenant?.settings).toEqual(updates.settings);
    });

    it('should throw error if updating to existing subdomain', async () => {
      const tenant1 = await createTestTenant({ subdomain: 'gym1' });
      const tenant2 = await createTestTenant({ subdomain: 'gym2' });

      await expect(
        tenantService.updateTenant(tenant1.id, { subdomain: 'gym2' })
      ).rejects.toThrow('Subdomain already exists');
    });

    it('should throw error if tenant not found', async () => {
      await expect(
        tenantService.updateTenant('non-existent-id', { name: 'Updated' })
      ).rejects.toThrow();
    });
  });

  describe('deleteTenant', () => {
    it('should soft delete tenant successfully', async () => {
      const createdTenant = await createTestTenant();
      
      const result = await tenantService.deleteTenant(createdTenant.id);
      expect(result).toBe(true);

      // Verify tenant is soft deleted (status = inactive)
      const prisma = getTestPrisma();
      const tenant = await prisma.tenant.findUnique({
        where: { id: createdTenant.id },
      });
      
      expect(tenant?.status).toBe('inactive');
    });

    it('should return false if tenant not found', async () => {
      const result = await tenantService.deleteTenant('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('listTenants', () => {
    it('should list all tenants', async () => {
      await createTestTenant({ name: 'Gym 1' });
      await createTestTenant({ name: 'Gym 2' });
      await createTestTenant({ name: 'Gym 3' });

      const result = await tenantService.listTenants();
      
      expect(result.tenants).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter tenants by status', async () => {
      await createTestTenant({ name: 'Active Gym', status: 'active' });
      await createTestTenant({ name: 'Inactive Gym', status: 'inactive' });

      const activeResult = await tenantService.listTenants({ status: 'active' });
      const inactiveResult = await tenantService.listTenants({ status: 'inactive' });

      expect(activeResult.tenants).toHaveLength(1);
      expect(activeResult.tenants[0].name).toBe('Active Gym');
      
      expect(inactiveResult.tenants).toHaveLength(1);
      expect(inactiveResult.tenants[0].name).toBe('Inactive Gym');
    });

    it('should filter tenants by plan', async () => {
      await createTestTenant({ name: 'Starter Gym', plan: 'starter' });
      await createTestTenant({ name: 'Pro Gym', plan: 'professional' });

      const starterResult = await tenantService.listTenants({ plan: 'starter' });
      const proResult = await tenantService.listTenants({ plan: 'professional' });

      expect(starterResult.tenants).toHaveLength(1);
      expect(starterResult.tenants[0].name).toBe('Starter Gym');
      
      expect(proResult.tenants).toHaveLength(1);
      expect(proResult.tenants[0].name).toBe('Pro Gym');
    });

    it('should support pagination', async () => {
      // Create 5 tenants
      for (let i = 1; i <= 5; i++) {
        await createTestTenant({ name: `Gym ${i}` });
      }

      const page1 = await tenantService.listTenants({ limit: 2, offset: 0 });
      const page2 = await tenantService.listTenants({ limit: 2, offset: 2 });

      expect(page1.tenants).toHaveLength(2);
      expect(page2.tenants).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page2.total).toBe(5);
    });
  });
});
