import { PrismaClient } from '@prisma/client';
import { config } from '../config/config';

// Test database configuration
const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/fitos_test';

let testPrisma: PrismaClient;

export const setupTestDatabase = async (): Promise<PrismaClient> => {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl,
        },
      },
    });
  }

  await testPrisma.$connect();
  return testPrisma;
};

export const cleanupTestDatabase = async (): Promise<void> => {
  if (testPrisma) {
    // Clean up test data
    await testPrisma.refreshToken.deleteMany();
    await testPrisma.chatMessage.deleteMany();
    await testPrisma.workout.deleteMany();
    await testPrisma.member.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.tenant.deleteMany();
    
    await testPrisma.$disconnect();
  }
};

export const getTestPrisma = (): PrismaClient => {
  if (!testPrisma) {
    throw new Error('Test database not connected. Call setupTestDatabase() first.');
  }
  return testPrisma;
};

// Test data factories
export const createTestTenant = async (overrides: any = {}) => {
  const prisma = getTestPrisma();
  
  return await prisma.tenant.create({
    data: {
      name: 'Test Gym',
      subdomain: 'test-gym',
      billingEmail: 'test@gym.com',
      plan: 'starter',
      status: 'active',
      settings: {},
      ...overrides,
    },
  });
};

export const createTestUser = async (tenantId: string, overrides: any = {}) => {
  const prisma = getTestPrisma();
  
  return await prisma.user.create({
    data: {
      email: 'test@user.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7', // 'password'
      firstName: 'Test',
      lastName: 'User',
      role: 'MEMBER',
      status: 'ACTIVE',
      tenantId,
      ...overrides,
    },
  });
};

export const createTestMember = async (tenantId: string, overrides: any = {}) => {
  const prisma = getTestPrisma();
  
  return await prisma.member.create({
    data: {
      name: 'Test Member',
      email: 'member@test.com',
      phone: '+1234567890',
      tenantId,
      ...overrides,
    },
  });
};
