import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { tenantMiddleware, RequestWithTenant } from '../middleware/tenant';
import { setupTestDatabase, cleanupTestDatabase, createTestTenant } from './setup';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('TenantMiddleware', () => {
  let mockRequest: Partial<RequestWithTenant>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    await setupTestDatabase();
    
    mockRequest = {
      get: jest.fn(),
      path: '/api/test',
      headers: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  describe('Health check endpoints', () => {
    it('should skip tenant resolution for health check endpoints', async () => {
      mockRequest.path = '/api/health';
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Tenant resolution by ID', () => {
    it('should resolve tenant by ID from headers', async () => {
      const tenant = await createTestTenant();
      mockRequest.headers = { 'x-tenant-id': tenant.id };
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockRequest.tenant).toBeDefined();
      expect(mockRequest.tenant?.id).toBe(tenant.id);
      expect(mockResponse.set).toHaveBeenCalledWith('X-Tenant-ID', tenant.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 404 if tenant ID not found', async () => {
      mockRequest.headers = { 'x-tenant-id': 'non-existent-id' };
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Tenant not found' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Tenant resolution by host', () => {
    it('should resolve tenant by custom domain', async () => {
      const tenant = await createTestTenant({ customDomain: 'test-gym.com' });
      (mockRequest.get as jest.Mock).mockReturnValue('test-gym.com');
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockRequest.tenant).toBeDefined();
      expect(mockRequest.tenant?.id).toBe(tenant.id);
      expect(mockRequest.tenant?.customDomain).toBe('test-gym.com');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should resolve tenant by subdomain', async () => {
      const tenant = await createTestTenant({ subdomain: 'test-gym' });
      (mockRequest.get as jest.Mock).mockReturnValue('test-gym.localhost');
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockRequest.tenant).toBeDefined();
      expect(mockRequest.tenant?.id).toBe(tenant.id);
      expect(mockRequest.tenant?.subdomain).toBe('test-gym');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 404 if host not found', async () => {
      (mockRequest.get as jest.Mock).mockReturnValue('non-existent.localhost');
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Tenant not found' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Tenant status validation', () => {
    it('should allow active tenants', async () => {
      const tenant = await createTestTenant({ status: 'active' });
      (mockRequest.get as jest.Mock).mockReturnValue('test-gym.localhost');
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockRequest.tenant).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject inactive tenants', async () => {
      await createTestTenant({ subdomain: 'inactive-gym', status: 'inactive' });
      (mockRequest.get as jest.Mock).mockReturnValue('inactive-gym.localhost');
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Tenant not found' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject suspended tenants', async () => {
      await createTestTenant({ subdomain: 'suspended-gym', status: 'suspended' });
      (mockRequest.get as jest.Mock).mockReturnValue('suspended-gym.localhost');
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Tenant not found' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error by using an invalid tenant ID format
      mockRequest.headers = { 'x-tenant-id': 'invalid-format' };
      
      await tenantMiddleware(mockRequest as RequestWithTenant, mockResponse as Response, mockNext);
      
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: { message: 'Internal server error' },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
