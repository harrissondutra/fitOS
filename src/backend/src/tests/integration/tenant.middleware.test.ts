import { Request, Response, NextFunction } from 'express';
import { tenantMiddleware } from '../../middleware/tenant.middleware';
import { logger } from '../../utils/logger';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Tenant Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      params: {},
      query: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should extract tenant from subdomain', () => {
    mockRequest.headers = { host: 'tenant1.example.com' };
    
    tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockRequest.tenantId).toBe('tenant1');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should extract tenant from header', () => {
    mockRequest.headers = { 'x-tenant-id': 'tenant2' };
    
    tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockRequest.tenantId).toBe('tenant2');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should extract tenant from query parameter', () => {
    mockRequest.query = { tenant: 'tenant3' };
    
    tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockRequest.tenantId).toBe('tenant3');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 if no tenant found', () => {
    tenantMiddleware(mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Tenant ID is required',
    });
    expect(mockNext).not.toHaveBeenCalled();
  });
});