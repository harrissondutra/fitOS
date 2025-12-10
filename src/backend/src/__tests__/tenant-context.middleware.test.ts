import { Request, Response, NextFunction } from 'express';
import { createTenantContextMiddleware } from '../middleware/tenant-context.middleware';

jest.mock('../config/database', () => ({
  getPrismaClient: () => ({
    tenant: {
      findUnique: jest.fn().mockResolvedValue({ dbStrategy: 'row_level', status: 'active' })
    }
  })
}));

describe('TenantContextMiddleware', () => {
  it('injeta app.current_tenant para row_level quando X-Organization-Id presente', async () => {
    const mockExecute = jest.fn().mockResolvedValue(undefined);
    const connectionManager = {
      getConnection: jest.fn().mockResolvedValue({
        $executeRawUnsafe: mockExecute,
      })
    } as any;

    const mw = createTenantContextMiddleware(connectionManager);
    const req = {
      headers: { 'x-organization-id': 'org-123' },
      get: jest.fn().mockReturnValue('localhost:3001')
    } as unknown as Request;
    const res = { set: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() } as any as Response;
    const next: NextFunction = jest.fn();

    await mw(req, res, next);

    expect(connectionManager.getConnection).toHaveBeenCalledWith('org-123');
    expect(mockExecute).toHaveBeenCalledWith(expect.stringContaining("SET app.current_tenant = 'org-123'"));
    expect((req as any).organizationId).toBe('org-123');
    expect(next).toHaveBeenCalled();
  });
});



