import { PrismaTenantWrapper } from '../services/prisma-tenant-wrapper.service';

describe('PrismaTenantWrapper', () => {
  it('falha quando current_tenant não corresponde ao organizationId', async () => {
    const mockPrisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ current_tenant: 'another-tenant' }])
    } as any;

    const wrapper = new PrismaTenantWrapper(mockPrisma, 'org-xyz', 'row_level', false);

    await expect(wrapper.$queryRaw`SELECT 1`).rejects.toThrow('Tenant context');
  });

  it('permite quando current_tenant corresponde ao organizationId', async () => {
    const mockPrisma = {
      $queryRaw: jest
        .fn()
        // Primeiro call: validateTenantContext -> SELECT current_setting
        .mockResolvedValueOnce([{ current_tenant: 'org-xyz' }])
        // Segundo call: a query real
        .mockResolvedValueOnce([{ ok: 1 }])
    } as any;

    const wrapper = new PrismaTenantWrapper(mockPrisma, 'org-xyz', 'row_level', false);
    const res = await wrapper.$queryRaw`SELECT 1`;
    expect(res).toEqual([{ ok: 1 }]);
  });
});



