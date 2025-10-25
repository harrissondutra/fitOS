export interface IntegrationConfig {
  id: string;
  integration: string;
  displayName: string;
  description?: string;
  category: IntegrationCategory;
  icon?: string;
  environment: 'test' | 'production';
  config: Record<string, any>;
  metadata: Record<string, any>;
  isActive: boolean;
  isConfigured: boolean;
  lastTested?: Date;
  lastTestStatus?: 'success' | 'failure';
  lastTestMessage?: string;
  sdkVersion?: string;
  documentationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type IntegrationCategory = 
  | 'ai' 
  | 'payment' 
  | 'communication' 
  | 'storage' 
  | 'calendar'
  | 'automation'
  | 'wearables'
  | 'analytics'
  | 'email'
  | 'backend'
  | 'location'
  | 'webhooks';

export interface IntegrationTemplate {
  id: string;
  integration: string;
  displayName: string;
  category: IntegrationCategory;
  icon?: string;
  configSchema: JSONSchema;
  requiredFields: ConfigField[];
  optionalFields: ConfigField[];
  testEndpoint?: string;
  documentationUrl: string;
  sdkPackage?: string;
  sdkVersion?: string;
  exampleConfig?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigField {
  name: string;
  type: 'text' | 'password' | 'number' | 'select' | 'toggle' | 'textarea';
  required: boolean;
  default?: any;
  description?: string;
  validation?: string;
  options?: SelectOption[];
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface IntegrationUsageLog {
  id: string;
  integrationId: string;
  eventType: 'api_call' | 'webhook' | 'test' | 'error';
  requestCount: number;
  tokensUsed?: number;
  cost?: number;
  status: 'success' | 'failure' | 'warning';
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface UsageStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  totalCost?: number;
  tokensUsed?: number;
  period: string;
}

export interface CreateIntegrationDTO {
  integration: string;
  displayName: string;
  description?: string;
  category: IntegrationCategory;
  icon?: string;
  environment?: 'test' | 'production';
  config?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UpdateIntegrationDTO {
  displayName?: string;
  description?: string;
  category?: IntegrationCategory;
  icon?: string;
  environment?: 'test' | 'production';
  config?: Record<string, any>;
  metadata?: Record<string, any>;
  isActive?: boolean;
}

export interface UsageLogDTO {
  eventType: 'api_call' | 'webhook' | 'test' | 'error';
  requestCount?: number;
  tokensUsed?: number;
  cost?: number;
  status: 'success' | 'failure' | 'warning';
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface TestInstructions {
  description: string;
  steps: string[];
  expectedResult: string;
}

// Global Limits Types
export interface GlobalLimitsConfig {
  id: string;
  plan: string;
  aiLimits: AILimits;
  uploadLimits: UploadLimits;
  featureLimits: FeatureLimits;
  rateLimits: RateLimits;
  createdAt: Date;
  updatedAt: Date;
}

export interface AILimits {
  // Global limits per tenant
  maxTokensPerMonth: number;
  maxRequestsPerMonth: number;
  maxConcurrentRequests: number;
  
  // Limits by AI service type
  openai: {
    maxTokensPerMonth: number;
    maxRequestsPerMonth: number;
    allowedModels: string[];
  };
  anthropic: {
    maxTokensPerMonth: number;
    maxRequestsPerMonth: number;
    allowedModels: string[];
  };
  groq: {
    maxTokensPerMonth: number;
    maxRequestsPerMonth: number;
    allowedModels: string[];
  };
  ollama: {
    maxTokensPerMonth: number;
    maxRequestsPerMonth: number;
    allowedModels: string[];
  };
  
  // Costs/budget per tenant
  monthlyBudget: number;
  costPerToken: Record<string, number>;
  costPerRequest: Record<string, number>;
}

export interface UploadLimits {
  maxFileSize: number; // in MB
  totalStorage: number; // in MB
  allowedFileTypes: string[];
  monthlyUploadQuota: number; // in MB
  maxFilesPerUpload: number;
  compressionEnabled: boolean;
}

export interface FeatureLimits {
  // Features that can be enabled/disabled per tenant
  aiChat: boolean;
  aiWorkoutGeneration: boolean;
  aiNutritionPlanning: boolean;
  aiProgressAnalysis: boolean;
  aiVoiceCoaching: boolean;
  biometricAnalysis: boolean;
  videoAnalysis: boolean;
  postureAnalysis: boolean;
  crmFeatures: boolean;
  whatsappIntegration: boolean;
  googleCalendarIntegration: boolean;
  stripeIntegration: boolean;
  mercadoPagoIntegration: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  webhookSupport: boolean;
  advancedAnalytics: boolean;
  multiLocation: boolean;
  teamManagement: boolean;
  clientPortal: boolean;
}

export interface RateLimits {
  // Rate limiting per tenant
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  
  // Specific rate limits
  aiRequestsPerMinute: number;
  uploadRequestsPerMinute: number;
  apiRequestsPerMinute: number;
  
  // Burst limits
  burstLimit: number;
  burstWindow: number; // in seconds
}

export interface TenantLimitOverride {
  tenantId: string;
  plan: string;
  overrides: {
    aiLimits?: Partial<AILimits>;
    uploadLimits?: Partial<UploadLimits>;
    featureLimits?: Partial<FeatureLimits>;
    rateLimits?: Partial<RateLimits>;
  };
  reason?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGlobalLimitsDTO {
  plan: string;
  aiLimits: AILimits;
  uploadLimits: UploadLimits;
  featureLimits: FeatureLimits;
  rateLimits: RateLimits;
}

export interface UpdateGlobalLimitsDTO {
  aiLimits?: Partial<AILimits>;
  uploadLimits?: Partial<UploadLimits>;
  featureLimits?: Partial<FeatureLimits>;
  rateLimits?: Partial<RateLimits>;
}

export interface CreateTenantOverrideDTO {
  tenantId: string;
  plan: string;
  overrides: {
    aiLimits?: Partial<AILimits>;
    uploadLimits?: Partial<UploadLimits>;
    featureLimits?: Partial<FeatureLimits>;
    rateLimits?: Partial<RateLimits>;
  };
  reason?: string;
  expiresAt?: Date;
}

// Integration Knowledge Base Types
export interface IntegrationKnowledgeBase {
  [key: string]: IntegrationDefinition;
}

export interface IntegrationDefinition {
  context7Id?: string;
  category: IntegrationCategory;
  displayName: string;
  icon?: string;
  configFields: ConfigField[];
  testEndpoint?: string;
  testMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  sdkPackage?: string;
  sdkVersion?: string;
  documentationUrl?: string;
}

// JSON Schema types
export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  default?: any;
  enum?: any[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
}

// API Response types
export interface IntegrationListResponse {
  integrations: IntegrationConfig[];
  total: number;
  page: number;
  limit: number;
}

export interface IntegrationUsageResponse {
  usage: UsageStats;
  logs: IntegrationUsageLog[];
  total: number;
  page: number;
  limit: number;
}

export interface GlobalLimitsListResponse {
  limits: GlobalLimitsConfig[];
  total: number;
}

export interface TenantOverrideListResponse {
  overrides: TenantLimitOverride[];
  total: number;
  page: number;
  limit: number;
}









