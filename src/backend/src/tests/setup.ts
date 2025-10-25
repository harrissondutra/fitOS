import { PrismaClient } from '@prisma/client';

// Mock do Prisma para testes
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    marketplaceListing: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    marketplaceOrder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    marketplaceReview: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

// Mock das integrações externas
jest.mock('../integrations/stripe', () => ({
  stripeService: {
    isIntegrationEnabled: () => true,
    createPaymentIntent: jest.fn(),
    createTransfer: jest.fn(),
    handleWebhook: jest.fn(),
  },
}));

jest.mock('../integrations/mercadopago', () => ({
  mercadoPagoService: {
    isIntegrationEnabled: () => true,
    createPreference: jest.fn(),
    handleWebhook: jest.fn(),
  },
}));

jest.mock('../integrations/notifications', () => ({
  notificationsService: {
    sendNotification: jest.fn(),
  },
}));

// Configuração global para testes
beforeAll(async () => {
  // Setup inicial se necessário
});

afterAll(async () => {
  // Cleanup se necessário
});

afterEach(() => {
  // Limpar mocks após cada teste
  jest.clearAllMocks();
});

// Global test utilities
export const createMockProvider = (overrides = {}) => ({
  id: 'provider-1',
  name: 'test-provider',
  displayName: 'Test Provider',
  provider: 'OPENAI',
  apiKey: 'encrypted-key',
  baseUrl: 'https://api.openai.com/v1',
  models: ['gpt-4'],
  isActive: true,
  isDefault: false,
  timeout: 30000,
  maxRetries: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockServiceConfig = (overrides = {}) => ({
  id: 'config-1',
  serviceType: 'CHAT',
  serviceName: 'Chat Geral',
  providerId: 'provider-1',
  model: 'gpt-4',
  priority: 1,
  isActive: true,
  maxRequestsPerMinute: 60,
  costPerRequest: 0.02,
  config: {
    temperature: 0.7,
    maxTokens: 1024,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createMockWebhookLog = (overrides = {}) => ({
  id: 'log-1',
  providerId: 'provider-1',
  tenantId: 'tenant-1',
  direction: 'INBOUND',
  requestUrl: 'https://api.example.com/webhook',
  requestMethod: 'POST',
  requestHeaders: { 'Content-Type': 'application/json' },
  requestBody: { test: 'data' },
  responseStatus: 200,
  responseHeaders: { 'Content-Type': 'application/json' },
  responseBody: { success: true },
  duration: 150,
  error: null,
  jobId: null,
  createdAt: new Date(),
  ...overrides,
})

export const createMockJob = (overrides = {}) => ({
  id: 'job-1',
  serviceType: 'CHAT',
  providerId: 'provider-1',
  tenantId: 'tenant-1',
  status: 'PENDING',
  input: { message: 'Hello' },
  output: null,
  error: null,
  startedAt: null,
  completedAt: null,
  attempts: 0,
  userId: 'user-1',
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock API responses
export const mockApiResponses = {
  success: (data: any) => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data }),
  }),
  created: (data: any) => ({
    ok: true,
    status: 201,
    json: () => Promise.resolve({ success: true, data }),
  }),
  error: (message: string, status = 400) => ({
    ok: false,
    status,
    statusText: message,
    json: () => Promise.resolve({ success: false, error: message }),
  }),
  unauthorized: () => ({
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    json: () => Promise.resolve({ success: false, error: 'Unauthorized' }),
  }),
  notFound: () => ({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    json: () => Promise.resolve({ success: false, error: 'Not Found' }),
  }),
  serverError: () => ({
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    json: () => Promise.resolve({ success: false, error: 'Internal Server Error' }),
  }),
}