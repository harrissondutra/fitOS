import { Request, Response, NextFunction } from 'express';
import { CreateIntegrationDTO, UpdateIntegrationDTO, CreateGlobalLimitsDTO, UpdateGlobalLimitsDTO } from '../../../shared/types/integrations.types';
import integrationKnowledgeBase from '../data/integration-knowledge-base.json';

/**
 * Validate integration data
 */
export const validateIntegration = (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const errors: string[] = [];

    // Required fields for creation
    if (req.method === 'POST') {
      if (!data.integration) errors.push('Integration name is required');
      if (!data.displayName) errors.push('Display name is required');
      if (!data.category) errors.push('Category is required');
    }

    // Validate integration exists in knowledge base
    if (data.integration && !integrationKnowledgeBase[data.integration]) {
      errors.push(`Integration ${data.integration} not found in knowledge base`);
    }

    // Validate category
    const validCategories = ['ai', 'payment', 'communication', 'storage', 'calendar', 'automation', 'wearables', 'analytics', 'email', 'backend', 'location', 'webhooks'];
    if (data.category && !validCategories.includes(data.category)) {
      errors.push(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }

    // Validate environment
    if (data.environment && !['test', 'production'].includes(data.environment)) {
      errors.push('Environment must be either "test" or "production"');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    return next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
};

/**
 * Validate global limits data
 */
export const validateGlobalLimits = (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const errors: string[] = [];

    // Required fields
    if (!data.plan) errors.push('Plan is required');

    // Validate plan
    const validPlans = ['starter', 'professional', 'enterprise'];
    if (data.plan && !validPlans.includes(data.plan)) {
      errors.push(`Invalid plan. Must be one of: ${validPlans.join(', ')}`);
    }

    // Validate AI limits structure
    if (data.aiLimits) {
      const aiLimits = data.aiLimits;
      
      if (typeof aiLimits.maxTokensPerMonth !== 'number' || aiLimits.maxTokensPerMonth < 0) {
        errors.push('AI maxTokensPerMonth must be a positive number');
      }
      
      if (typeof aiLimits.maxRequestsPerMonth !== 'number' || aiLimits.maxRequestsPerMonth < 0) {
        errors.push('AI maxRequestsPerMonth must be a positive number');
      }
      
      if (typeof aiLimits.maxConcurrentRequests !== 'number' || aiLimits.maxConcurrentRequests < 0) {
        errors.push('AI maxConcurrentRequests must be a positive number');
      }
      
      if (typeof aiLimits.monthlyBudget !== 'number' || aiLimits.monthlyBudget < 0) {
        errors.push('AI monthlyBudget must be a positive number');
      }
    }

    // Validate upload limits structure
    if (data.uploadLimits) {
      const uploadLimits = data.uploadLimits;
      
      if (typeof uploadLimits.maxFileSize !== 'number' || uploadLimits.maxFileSize < 0) {
        errors.push('Upload maxFileSize must be a positive number');
      }
      
      if (typeof uploadLimits.totalStorage !== 'number' || uploadLimits.totalStorage < 0) {
        errors.push('Upload totalStorage must be a positive number');
      }
      
      if (!Array.isArray(uploadLimits.allowedFileTypes)) {
        errors.push('Upload allowedFileTypes must be an array');
      }
      
      if (typeof uploadLimits.monthlyUploadQuota !== 'number' || uploadLimits.monthlyUploadQuota < 0) {
        errors.push('Upload monthlyUploadQuota must be a positive number');
      }
    }

    // Validate feature limits structure
    if (data.featureLimits) {
      const featureLimits = data.featureLimits;
      const validFeatures = [
        'aiChat', 'aiWorkoutGeneration', 'aiNutritionPlanning', 'aiProgressAnalysis',
        'aiVoiceCoaching', 'biometricAnalysis', 'videoAnalysis', 'postureAnalysis',
        'crmFeatures', 'whatsappIntegration', 'googleCalendarIntegration',
        'stripeIntegration', 'mercadoPagoIntegration', 'customBranding',
        'apiAccess', 'webhookSupport', 'advancedAnalytics', 'multiLocation',
        'teamManagement', 'clientPortal'
      ];
      
      Object.keys(featureLimits).forEach(feature => {
        if (!validFeatures.includes(feature)) {
          errors.push(`Invalid feature: ${feature}`);
        }
        
        if (typeof featureLimits[feature] !== 'boolean') {
          errors.push(`Feature ${feature} must be a boolean`);
        }
      });
    }

    // Validate rate limits structure
    if (data.rateLimits) {
      const rateLimits = data.rateLimits;
      
      if (typeof rateLimits.requestsPerMinute !== 'number' || rateLimits.requestsPerMinute < 0) {
        errors.push('Rate limit requestsPerMinute must be a positive number');
      }
      
      if (typeof rateLimits.requestsPerHour !== 'number' || rateLimits.requestsPerHour < 0) {
        errors.push('Rate limit requestsPerHour must be a positive number');
      }
      
      if (typeof rateLimits.requestsPerDay !== 'number' || rateLimits.requestsPerDay < 0) {
        errors.push('Rate limit requestsPerDay must be a positive number');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    return next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
};

/**
 * Validate tenant override data
 */
export const validateTenantOverride = (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const errors: string[] = [];

    // Required fields
    if (!data.tenantId) errors.push('Tenant ID is required');
    if (!data.plan) errors.push('Plan is required');

    // Validate plan
    const validPlans = ['starter', 'professional', 'enterprise'];
    if (data.plan && !validPlans.includes(data.plan)) {
      errors.push(`Invalid plan. Must be one of: ${validPlans.join(', ')}`);
    }

    // Validate overrides structure
    if (data.overrides) {
      const overrides = data.overrides;
      
      // Validate AI limits override
      if (overrides.aiLimits) {
        const aiLimits = overrides.aiLimits;
        
        if (aiLimits.maxTokensPerMonth !== undefined && (typeof aiLimits.maxTokensPerMonth !== 'number' || aiLimits.maxTokensPerMonth < 0)) {
          errors.push('AI maxTokensPerMonth override must be a positive number');
        }
        
        if (aiLimits.maxRequestsPerMonth !== undefined && (typeof aiLimits.maxRequestsPerMonth !== 'number' || aiLimits.maxRequestsPerMonth < 0)) {
          errors.push('AI maxRequestsPerMonth override must be a positive number');
        }
        
        if (aiLimits.monthlyBudget !== undefined && (typeof aiLimits.monthlyBudget !== 'number' || aiLimits.monthlyBudget < 0)) {
          errors.push('AI monthlyBudget override must be a positive number');
        }
      }
      
      // Validate upload limits override
      if (overrides.uploadLimits) {
        const uploadLimits = overrides.uploadLimits;
        
        if (uploadLimits.maxFileSize !== undefined && (typeof uploadLimits.maxFileSize !== 'number' || uploadLimits.maxFileSize < 0)) {
          errors.push('Upload maxFileSize override must be a positive number');
        }
        
        if (uploadLimits.totalStorage !== undefined && (typeof uploadLimits.totalStorage !== 'number' || uploadLimits.totalStorage < 0)) {
          errors.push('Upload totalStorage override must be a positive number');
        }
        
        if (uploadLimits.monthlyUploadQuota !== undefined && (typeof uploadLimits.monthlyUploadQuota !== 'number' || uploadLimits.monthlyUploadQuota < 0)) {
          errors.push('Upload monthlyUploadQuota override must be a positive number');
        }
      }
      
      // Validate feature limits override
      if (overrides.featureLimits) {
        const featureLimits = overrides.featureLimits;
        const validFeatures = [
          'aiChat', 'aiWorkoutGeneration', 'aiNutritionPlanning', 'aiProgressAnalysis',
          'aiVoiceCoaching', 'biometricAnalysis', 'videoAnalysis', 'postureAnalysis',
          'crmFeatures', 'whatsappIntegration', 'googleCalendarIntegration',
          'stripeIntegration', 'mercadoPagoIntegration', 'customBranding',
          'apiAccess', 'webhookSupport', 'advancedAnalytics', 'multiLocation',
          'teamManagement', 'clientPortal'
        ];
        
        Object.keys(featureLimits).forEach(feature => {
          if (!validFeatures.includes(feature)) {
            errors.push(`Invalid feature override: ${feature}`);
          }
          
          if (typeof featureLimits[feature] !== 'boolean') {
            errors.push(`Feature ${feature} override must be a boolean`);
          }
        });
      }
      
      // Validate rate limits override
      if (overrides.rateLimits) {
        const rateLimits = overrides.rateLimits;
        
        if (rateLimits.requestsPerMinute !== undefined && (typeof rateLimits.requestsPerMinute !== 'number' || rateLimits.requestsPerMinute < 0)) {
          errors.push('Rate limit requestsPerMinute override must be a positive number');
        }
        
        if (rateLimits.requestsPerHour !== undefined && (typeof rateLimits.requestsPerHour !== 'number' || rateLimits.requestsPerHour < 0)) {
          errors.push('Rate limit requestsPerHour override must be a positive number');
        }
        
        if (rateLimits.requestsPerDay !== undefined && (typeof rateLimits.requestsPerDay !== 'number' || rateLimits.requestsPerDay < 0)) {
          errors.push('Rate limit requestsPerDay override must be a positive number');
        }
      }
    }

    // Validate expiration date
    if (data.expiresAt && isNaN(Date.parse(data.expiresAt))) {
      errors.push('ExpiresAt must be a valid date');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    return next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
};

/**
 * Validate usage log data
 */
export const validateUsageLog = (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const errors: string[] = [];

    // Required fields
    if (!data.eventType) errors.push('Event type is required');
    if (!data.status) errors.push('Status is required');

    // Validate event type
    const validEventTypes = ['api_call', 'webhook', 'test', 'error'];
    if (data.eventType && !validEventTypes.includes(data.eventType)) {
      errors.push(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['success', 'failure', 'warning'];
    if (data.status && !validStatuses.includes(data.status)) {
      errors.push(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate numeric fields
    if (data.requestCount !== undefined && (typeof data.requestCount !== 'number' || data.requestCount < 0)) {
      errors.push('Request count must be a positive number');
    }
    
    if (data.tokensUsed !== undefined && (typeof data.tokensUsed !== 'number' || data.tokensUsed < 0)) {
      errors.push('Tokens used must be a positive number');
    }
    
    if (data.cost !== undefined && (typeof data.cost !== 'number' || data.cost < 0)) {
      errors.push('Cost must be a positive number');
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    return next();
  } catch (error) {
    console.error('Validation error:', error);
    return res.status(500).json({ error: 'Validation failed' });
  }
};

