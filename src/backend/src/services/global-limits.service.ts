import { PrismaClient } from '@prisma/client';
import { 
  GlobalLimitsConfig, 
  CreateGlobalLimitsDTO, 
  UpdateGlobalLimitsDTO,
  AILimits,
  UploadLimits,
  FeatureLimits,
  RateLimits,
  TenantLimitOverride,
  CreateTenantOverrideDTO
} from '../../../shared/types/integrations.types';

const prisma = new PrismaClient();

export class GlobalLimitsService {
  /**
   * Create global limits configuration for a plan
   */
  async create(data: CreateGlobalLimitsDTO): Promise<GlobalLimitsConfig> {
    const limits = await prisma.globalLimitsConfig.create({
      data: {
        plan: data.plan,
        aiLimits: data.aiLimits as any,
        uploadLimits: data.uploadLimits as any,
        featureLimits: data.featureLimits as any,
        rateLimits: data.rateLimits as any
      }
    });

    return limits as any;
  }

  /**
   * Get all global limits configurations
   */
  async findAll(): Promise<GlobalLimitsConfig[]> {
    const limits = await prisma.globalLimitsConfig.findMany({
      orderBy: { plan: 'asc' }
    });

    return limits as any;
  }

  /**
   * Get global limits for a specific plan
   */
  async findByPlan(plan: string): Promise<GlobalLimitsConfig | null> {
    const limits = await prisma.globalLimitsConfig.findUnique({
      where: { plan }
    });

    return limits as unknown as GlobalLimitsConfig | null;
  }

  /**
   * Update global limits for a plan
   */
  async update(plan: string, data: UpdateGlobalLimitsDTO): Promise<GlobalLimitsConfig> {
    const existingLimits = await this.findByPlan(plan);
    if (!existingLimits) {
      throw new Error(`Global limits for plan ${plan} not found`);
    }

    const updateData: any = {};
    
    if (data.aiLimits) {
      updateData.aiLimits = { ...existingLimits.aiLimits, ...data.aiLimits };
    }
    
    if (data.uploadLimits) {
      updateData.uploadLimits = { ...existingLimits.uploadLimits, ...data.uploadLimits };
    }
    
    if (data.featureLimits) {
      updateData.featureLimits = { ...existingLimits.featureLimits, ...data.featureLimits };
    }
    
    if (data.rateLimits) {
      updateData.rateLimits = { ...existingLimits.rateLimits, ...data.rateLimits };
    }

    const updatedLimits = await prisma.globalLimitsConfig.update({
      where: { plan },
      data: updateData
    });

    return updatedLimits as any;
  }

  /**
   * Delete global limits for a plan
   */
  async delete(plan: string): Promise<void> {
    await prisma.globalLimitsConfig.delete({
      where: { plan }
    });
  }

  /**
   * Get effective limits for a tenant (considering overrides)
   */
  async getEffectiveLimits(tenantId: string, plan: string): Promise<{
    aiLimits: AILimits;
    uploadLimits: UploadLimits;
    featureLimits: FeatureLimits;
    rateLimits: RateLimits;
  }> {
    // Get base limits for the plan
    const baseLimits = await this.findByPlan(plan);
    if (!baseLimits) {
      throw new Error(`Global limits for plan ${plan} not found`);
    }

    // Check for tenant-specific overrides
    const override = await this.getTenantOverride(tenantId);
    
    if (!override) {
      return {
        aiLimits: baseLimits.aiLimits as AILimits,
        uploadLimits: baseLimits.uploadLimits as UploadLimits,
        featureLimits: baseLimits.featureLimits as FeatureLimits,
        rateLimits: baseLimits.rateLimits as RateLimits
      };
    }

    // Apply overrides
    return {
      aiLimits: { ...baseLimits.aiLimits, ...override.overrides.aiLimits } as AILimits,
      uploadLimits: { ...baseLimits.uploadLimits, ...override.overrides.uploadLimits } as UploadLimits,
      featureLimits: { ...baseLimits.featureLimits, ...override.overrides.featureLimits } as FeatureLimits,
      rateLimits: { ...baseLimits.rateLimits, ...override.overrides.rateLimits } as RateLimits
    };
  }

  /**
   * Validate AI usage against limits
   */
  async validateAIUsage(tenantId: string, plan: string, usage: {
    tokensUsed: number;
    requestsCount: number;
    serviceType: string;
    model?: string;
  }): Promise<{ valid: boolean; reason?: string }> {
    const limits = await this.getEffectiveLimits(tenantId, plan);
    const aiLimits = limits.aiLimits;

    // Check global monthly limits
    if (usage.tokensUsed > aiLimits.maxTokensPerMonth) {
      return { valid: false, reason: 'Monthly token limit exceeded' };
    }

    if (usage.requestsCount > aiLimits.maxRequestsPerMonth) {
      return { valid: false, reason: 'Monthly request limit exceeded' };
    }

    // Check service-specific limits
    const serviceLimits = aiLimits[usage.serviceType as keyof AILimits];
    if (serviceLimits && typeof serviceLimits === 'object') {
      const serviceLimit = serviceLimits as any;
      
      if (usage.tokensUsed > serviceLimit.maxTokensPerMonth) {
        return { valid: false, reason: `${usage.serviceType} monthly token limit exceeded` };
      }

      if (usage.requestsCount > serviceLimit.maxRequestsPerMonth) {
        return { valid: false, reason: `${usage.serviceType} monthly request limit exceeded` };
      }

      // Check allowed models
      if (usage.model && serviceLimit.allowedModels && !serviceLimit.allowedModels.includes(usage.model)) {
        return { valid: false, reason: `Model ${usage.model} not allowed for ${usage.serviceType}` };
      }
    }

    // Check monthly budget
    const estimatedCost = this.calculateAICost(usage, aiLimits);
    if (estimatedCost > aiLimits.monthlyBudget) {
      return { valid: false, reason: 'Monthly AI budget exceeded' };
    }

    return { valid: true };
  }

  /**
   * Validate upload against limits
   */
  async validateUpload(tenantId: string, plan: string, upload: {
    fileSize: number; // in MB
    fileType: string;
    totalStorage: number; // in MB
    monthlyUploads: number; // in MB
  }): Promise<{ valid: boolean; reason?: string }> {
    const limits = await this.getEffectiveLimits(tenantId, plan);
    const uploadLimits = limits.uploadLimits;

    // Check file size
    if (upload.fileSize > uploadLimits.maxFileSize) {
      return { valid: false, reason: `File size exceeds limit of ${uploadLimits.maxFileSize}MB` };
    }

    // Check file type
    if (!uploadLimits.allowedFileTypes.includes(upload.fileType)) {
      return { valid: false, reason: `File type ${upload.fileType} not allowed` };
    }

    // Check total storage
    if (upload.totalStorage > uploadLimits.totalStorage) {
      return { valid: false, reason: `Total storage exceeds limit of ${uploadLimits.totalStorage}MB` };
    }

    // Check monthly upload quota
    if (upload.monthlyUploads > uploadLimits.monthlyUploadQuota) {
      return { valid: false, reason: `Monthly upload quota exceeded (${uploadLimits.monthlyUploadQuota}MB)` };
    }

    return { valid: true };
  }

  /**
   * Validate feature access
   */
  async validateFeatureAccess(tenantId: string, plan: string, feature: string): Promise<{ valid: boolean; reason?: string }> {
    const limits = await this.getEffectiveLimits(tenantId, plan);
    const featureLimits = limits.featureLimits;

    const hasAccess = featureLimits[feature as keyof FeatureLimits];
    if (!hasAccess) {
      return { valid: false, reason: `Feature ${feature} not available in plan ${plan}` };
    }

    return { valid: true };
  }

  /**
   * Validate rate limits
   */
  async validateRateLimit(tenantId: string, plan: string, requestType: string): Promise<{ valid: boolean; reason?: string; retryAfter?: number }> {
    const limits = await this.getEffectiveLimits(tenantId, plan);
    const rateLimits = limits.rateLimits;

    // This would typically check against a Redis cache or similar
    // For now, we'll return valid (implementation would depend on rate limiting strategy)
    
    switch (requestType) {
      case 'ai':
        // Check AI-specific rate limits
        break;
      case 'upload':
        // Check upload-specific rate limits
        break;
      case 'api':
        // Check API-specific rate limits
        break;
      default:
        // Check general rate limits
        break;
    }

    return { valid: true };
  }

  /**
   * Calculate AI cost based on usage
   */
  private calculateAICost(usage: {
    tokensUsed: number;
    requestsCount: number;
    serviceType: string;
  }, aiLimits: AILimits): number {
    const tokenCost = aiLimits.costPerToken[usage.serviceType] || 0;
    const requestCost = aiLimits.costPerRequest[usage.serviceType] || 0;
    
    return (usage.tokensUsed * tokenCost) + (usage.requestsCount * requestCost);
  }

  /**
   * Create tenant-specific limit override
   */
  async createTenantOverride(data: CreateTenantOverrideDTO): Promise<TenantLimitOverride> {
    // Check if override already exists
    const existingOverride = await this.getTenantOverride(data.tenantId);
    if (existingOverride) {
      throw new Error(`Override already exists for tenant ${data.tenantId}`);
    }

    const override = await prisma.tenantLimitOverride.create({
      data: {
        tenantId: data.tenantId,
        plan: data.plan,
        overrides: data.overrides as any
      }
    });

    return override as any;
  }

  /**
   * Get tenant-specific limit override
   */
  async getTenantOverride(tenantId: string): Promise<TenantLimitOverride | null> {
    const override = await prisma.tenantLimitOverride.findFirst({
      where: { 
        tenantId
      },
      orderBy: { createdAt: 'desc' }
    });

    return override as TenantLimitOverride | null;
  }

  /**
   * Update tenant-specific limit override
   */
  async updateTenantOverride(tenantId: string, data: Partial<CreateTenantOverrideDTO>): Promise<TenantLimitOverride> {
    const existingOverride = await this.getTenantOverride(tenantId);
    if (!existingOverride) {
      throw new Error(`Override not found for tenant ${tenantId}`);
    }

    const updateData: any = {};
    
    if (data.plan) updateData.plan = data.plan;
    if (data.overrides) updateData.overrides = data.overrides;
    if (data.reason) updateData.reason = data.reason;
    if (data.expiresAt) updateData.expiresAt = data.expiresAt;

    const updatedOverride = await prisma.tenantLimitOverride.update({
      where: { tenantId: existingOverride.tenantId },
      data: updateData
    });

    return updatedOverride as TenantLimitOverride;
  }

  /**
   * Delete tenant-specific limit override
   */
  async deleteTenantOverride(tenantId: string): Promise<void> {
    const override = await this.getTenantOverride(tenantId);
    if (!override) {
      throw new Error(`Override not found for tenant ${tenantId}`);
    }

    await prisma.tenantLimitOverride.delete({
      where: { tenantId: override.tenantId }
    });
  }

  /**
   * Get all tenant overrides
   */
  async getAllTenantOverrides(filters: {
    plan?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<TenantLimitOverride[]> {
    const where: any = {};
    
    if (filters.plan) {
      where.plan = filters.plan;
    }

    const overrides = await prisma.tenantLimitOverride.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0
    });

    return overrides as TenantLimitOverride[];
  }

  /**
   * Get usage statistics for a tenant
   */
  async getTenantUsageStats(tenantId: string, period: string = '30d'): Promise<{
    aiUsage: {
      tokensUsed: number;
      requestsCount: number;
      cost: number;
      byService: Record<string, any>;
    };
    uploadUsage: {
      totalStorage: number;
      monthlyUploads: number;
      fileCount: number;
    };
    featureUsage: Record<string, number>;
  }> {
    const days = parseInt(period.replace('d', ''));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // This would typically aggregate data from usage tracking tables
    // For now, returning mock data structure
    
    return {
      aiUsage: {
        tokensUsed: 0,
        requestsCount: 0,
        cost: 0,
        byService: {}
      },
      uploadUsage: {
        totalStorage: 0,
        monthlyUploads: 0,
        fileCount: 0
      },
      featureUsage: {}
    };
  }

  /**
   * Get plan comparison data
   */
  async getPlanComparison(): Promise<{
    plans: string[];
    features: {
      [key: string]: {
        [plan: string]: boolean | number | string;
      };
    };
  }> {
    const limits = await this.findAll();
    const plans = limits.map(l => l.plan);
    
    const features: any = {};
    
    // Extract feature comparison data
    limits.forEach(limit => {
      const plan = limit.plan;
      
      // AI Limits
      features['aiTokensPerMonth'] = { ...features['aiTokensPerMonth'], [plan]: limit.aiLimits.maxTokensPerMonth };
      features['aiRequestsPerMonth'] = { ...features['aiRequestsPerMonth'], [plan]: limit.aiLimits.maxRequestsPerMonth };
      features['aiMonthlyBudget'] = { ...features['aiMonthlyBudget'], [plan]: limit.aiLimits.monthlyBudget };
      
      // Upload Limits
      features['maxFileSize'] = { ...features['maxFileSize'], [plan]: limit.uploadLimits.maxFileSize };
      features['totalStorage'] = { ...features['totalStorage'], [plan]: limit.uploadLimits.totalStorage };
      features['monthlyUploadQuota'] = { ...features['monthlyUploadQuota'], [plan]: limit.uploadLimits.monthlyUploadQuota };
      
      // Feature Limits
      Object.keys(limit.featureLimits).forEach(feature => {
        features[feature] = { ...features[feature], [plan]: limit.featureLimits[feature] };
      });
      
      // Rate Limits
      features['requestsPerMinute'] = { ...features['requestsPerMinute'], [plan]: limit.rateLimits.requestsPerMinute };
      features['requestsPerHour'] = { ...features['requestsPerHour'], [plan]: limit.rateLimits.requestsPerHour };
      features['requestsPerDay'] = { ...features['requestsPerDay'], [plan]: limit.rateLimits.requestsPerDay };
    });

    return { plans, features };
  }

  /**
   * Initialize default limits for all plans
   */
  async initializeDefaultLimits(): Promise<void> {
    const defaultLimits = {
      starter: {
        aiLimits: {
          maxTokensPerMonth: 100000,
          maxRequestsPerMonth: 1000,
          maxConcurrentRequests: 5,
          openai: { maxTokensPerMonth: 50000, maxRequestsPerMonth: 500, allowedModels: ['gpt-3.5-turbo'] },
          anthropic: { maxTokensPerMonth: 25000, maxRequestsPerMonth: 250, allowedModels: ['claude-3-haiku'] },
          groq: { maxTokensPerMonth: 25000, maxRequestsPerMonth: 250, allowedModels: ['llama3-8b-8192'] },
          ollama: { maxTokensPerMonth: 0, maxRequestsPerMonth: 0, allowedModels: [] },
          monthlyBudget: 50,
          costPerToken: { openai: 0.000002, anthropic: 0.000001, groq: 0.0000005, ollama: 0 },
          costPerRequest: { openai: 0.01, anthropic: 0.01, groq: 0.005, ollama: 0 }
        },
        uploadLimits: {
          maxFileSize: 10,
          totalStorage: 1000,
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
          monthlyUploadQuota: 100,
          maxFilesPerUpload: 5,
          compressionEnabled: true
        },
        featureLimits: {
          aiChat: true,
          aiWorkoutGeneration: false,
          aiNutritionPlanning: false,
          aiProgressAnalysis: false,
          aiVoiceCoaching: false,
          biometricAnalysis: true,
          videoAnalysis: false,
          postureAnalysis: false,
          crmFeatures: true,
          whatsappIntegration: false,
          googleCalendarIntegration: false,
          stripeIntegration: false,
          mercadoPagoIntegration: false,
          customBranding: false,
          apiAccess: false,
          webhookSupport: false,
          advancedAnalytics: false,
          multiLocation: false,
          teamManagement: false,
          clientPortal: true
        },
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 1000,
          requestsPerDay: 10000,
          aiRequestsPerMinute: 10,
          uploadRequestsPerMinute: 5,
          apiRequestsPerMinute: 30,
          burstLimit: 100,
          burstWindow: 60
        }
      },
      professional: {
        aiLimits: {
          maxTokensPerMonth: 500000,
          maxRequestsPerMonth: 5000,
          maxConcurrentRequests: 20,
          openai: { maxTokensPerMonth: 250000, maxRequestsPerMonth: 2500, allowedModels: ['gpt-3.5-turbo', 'gpt-4'] },
          anthropic: { maxTokensPerMonth: 125000, maxRequestsPerMonth: 1250, allowedModels: ['claude-3-haiku', 'claude-3-sonnet'] },
          groq: { maxTokensPerMonth: 125000, maxRequestsPerMonth: 1250, allowedModels: ['llama3-8b-8192', 'llama3-70b-8192'] },
          ollama: { maxTokensPerMonth: 0, maxRequestsPerMonth: 0, allowedModels: [] },
          monthlyBudget: 200,
          costPerToken: { openai: 0.000002, anthropic: 0.000001, groq: 0.0000005, ollama: 0 },
          costPerRequest: { openai: 0.01, anthropic: 0.01, groq: 0.005, ollama: 0 }
        },
        uploadLimits: {
          maxFileSize: 50,
          totalStorage: 5000,
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi'],
          monthlyUploadQuota: 500,
          maxFilesPerUpload: 10,
          compressionEnabled: true
        },
        featureLimits: {
          aiChat: true,
          aiWorkoutGeneration: true,
          aiNutritionPlanning: true,
          aiProgressAnalysis: true,
          aiVoiceCoaching: false,
          biometricAnalysis: true,
          videoAnalysis: true,
          postureAnalysis: true,
          crmFeatures: true,
          whatsappIntegration: true,
          googleCalendarIntegration: true,
          stripeIntegration: true,
          mercadoPagoIntegration: true,
          customBranding: true,
          apiAccess: true,
          webhookSupport: true,
          advancedAnalytics: true,
          multiLocation: false,
          teamManagement: true,
          clientPortal: true
        },
        rateLimits: {
          requestsPerMinute: 300,
          requestsPerHour: 5000,
          requestsPerDay: 50000,
          aiRequestsPerMinute: 50,
          uploadRequestsPerMinute: 20,
          apiRequestsPerMinute: 150,
          burstLimit: 500,
          burstWindow: 60
        }
      },
      enterprise: {
        aiLimits: {
          maxTokensPerMonth: 2000000,
          maxRequestsPerMonth: 20000,
          maxConcurrentRequests: 100,
          openai: { maxTokensPerMonth: 1000000, maxRequestsPerMonth: 10000, allowedModels: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'] },
          anthropic: { maxTokensPerMonth: 500000, maxRequestsPerMonth: 5000, allowedModels: ['claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'] },
          groq: { maxTokensPerMonth: 500000, maxRequestsPerMonth: 5000, allowedModels: ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768'] },
          ollama: { maxTokensPerMonth: 0, maxRequestsPerMonth: 0, allowedModels: [] },
          monthlyBudget: 1000,
          costPerToken: { openai: 0.000002, anthropic: 0.000001, groq: 0.0000005, ollama: 0 },
          costPerRequest: { openai: 0.01, anthropic: 0.01, groq: 0.005, ollama: 0 }
        },
        uploadLimits: {
          maxFileSize: 200,
          totalStorage: 50000,
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'mp4', 'mov', 'avi', 'zip', 'rar'],
          monthlyUploadQuota: 2000,
          maxFilesPerUpload: 50,
          compressionEnabled: true
        },
        featureLimits: {
          aiChat: true,
          aiWorkoutGeneration: true,
          aiNutritionPlanning: true,
          aiProgressAnalysis: true,
          aiVoiceCoaching: true,
          biometricAnalysis: true,
          videoAnalysis: true,
          postureAnalysis: true,
          crmFeatures: true,
          whatsappIntegration: true,
          googleCalendarIntegration: true,
          stripeIntegration: true,
          mercadoPagoIntegration: true,
          customBranding: true,
          apiAccess: true,
          webhookSupport: true,
          advancedAnalytics: true,
          multiLocation: true,
          teamManagement: true,
          clientPortal: true
        },
        rateLimits: {
          requestsPerMinute: 1000,
          requestsPerHour: 20000,
          requestsPerDay: 200000,
          aiRequestsPerMinute: 200,
          uploadRequestsPerMinute: 100,
          apiRequestsPerMinute: 500,
          burstLimit: 2000,
          burstWindow: 60
        }
      }
    };

    for (const [plan, limits] of Object.entries(defaultLimits)) {
      await prisma.globalLimitsConfig.upsert({
        where: { plan },
        update: limits,
        create: {
          plan,
          ...limits
        }
      });
    }
  }
}

export const globalLimitsService = new GlobalLimitsService();

