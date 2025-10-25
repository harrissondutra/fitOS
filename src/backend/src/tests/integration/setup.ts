import { PrismaClient } from '@prisma/client';

let testPrisma: PrismaClient;

// Mock Prisma Client for tests
const mockPrisma = {
  tenant: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

export const setupTestDatabase = async () => {
  testPrisma = mockPrisma as any;
  await testPrisma.$connect();
};

export const cleanupTestDatabase = async () => {
  if (testPrisma) {
    await testPrisma.$disconnect();
  }
};

export const getTestPrisma = () => testPrisma;

export const createTestTenant = async (data: any = {}) => {
  const mockTenant = {
    id: 'test-tenant-id',
    name: 'Test Tenant',
    plan: 'premium',
    tenantType: 'business',
    status: 'active',
    ...data,
  };
  
  mockPrisma.tenant.create.mockResolvedValue(mockTenant);
  return mockTenant;
};
