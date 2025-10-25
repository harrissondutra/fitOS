import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Schema para validação de limites globais
const globalLimitsSchema = Joi.object({
  aiLimits: Joi.object({
    globalMonthlyTokens: Joi.number().integer().min(0).required(),
    perServiceType: Joi.object().pattern(
      Joi.string(),
      Joi.object({
        monthlyTokens: Joi.number().integer().min(0).required(),
        costBudget: Joi.number().min(0).required()
      })
    ).required()
  }).required(),
  
  uploadLimits: Joi.object({
    maxFileSizeMB: Joi.number().integer().min(1).required(),
    totalStorageGB: Joi.number().integer().min(1).required(),
    allowedFileTypes: Joi.array().items(Joi.string()).required(),
    monthlyUploadQuotaGB: Joi.number().integer().min(1).required()
  }).required(),
  
  featureLimits: Joi.object().pattern(
    Joi.string(),
    Joi.alternatives().try(
      Joi.boolean(),
      Joi.number().integer().min(0)
    )
  ).required(),
  
  rateLimits: Joi.object({
    apiRequestsPerMinute: Joi.number().integer().min(1).required(),
    webhookCallsPerMinute: Joi.number().integer().min(1).required()
  }).required()
});

// Schema para validação de override de tenant
const tenantOverrideSchema = Joi.object({
  tenantId: Joi.string().required(),
  overrides: Joi.object({
    aiLimits: Joi.object({
      globalMonthlyTokens: Joi.number().integer().min(0).optional(),
      perServiceType: Joi.object().pattern(
        Joi.string(),
        Joi.object({
          monthlyTokens: Joi.number().integer().min(0).optional(),
          costBudget: Joi.number().min(0).optional()
        })
      ).optional()
    }).optional(),
    
    uploadLimits: Joi.object({
      maxFileSizeMB: Joi.number().integer().min(1).optional(),
      totalStorageGB: Joi.number().integer().min(1).optional(),
      allowedFileTypes: Joi.array().items(Joi.string()).optional(),
      monthlyUploadQuotaGB: Joi.number().integer().min(1).optional()
    }).optional(),
    
    featureLimits: Joi.object().pattern(
      Joi.string(),
      Joi.alternatives().try(
        Joi.boolean(),
        Joi.number().integer().min(0)
      )
    ).optional(),
    
    rateLimits: Joi.object({
      apiRequestsPerMinute: Joi.number().integer().min(1).optional(),
      webhookCallsPerMinute: Joi.number().integer().min(1).optional()
    }).optional()
  }).required()
});

// Schema para validação de check de limite
const checkLimitSchema = Joi.object({
  tenantId: Joi.string().required(),
  action: Joi.string().valid('ai_request', 'file_upload', 'api_call', 'webhook_call').required(),
  resource: Joi.string().required(),
  amount: Joi.number().integer().min(1).default(1)
});

// Schema para validação de reset de uso
const resetUsageSchema = Joi.object({
  tenantId: Joi.string().required(),
  period: Joi.string().valid('current', 'monthly', 'all').default('current')
});

// Schema para validação de importação
const importLimitsSchema = Joi.object({
  data: Joi.array().items(
    Joi.object({
      plan: Joi.string().required(),
      aiLimits: Joi.object().required(),
      uploadLimits: Joi.object().required(),
      featureLimits: Joi.object().required(),
      rateLimits: Joi.object().required()
    })
  ).required(),
  overwrite: Joi.boolean().default(false)
});

// Middleware para validar limites globais
export const validateGlobalLimits = (req: Request, res: Response, next: NextFunction) => {
  const { error } = globalLimitsSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  return next();
};

// Middleware para validar override de tenant
export const validateTenantOverride = (req: Request, res: Response, next: NextFunction) => {
  const { error } = tenantOverrideSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  return next();
};

// Middleware para validar check de limite
export const validateCheckLimit = (req: Request, res: Response, next: NextFunction) => {
  const { error } = checkLimitSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  return next();
};

// Middleware para validar reset de uso
export const validateResetUsage = (req: Request, res: Response, next: NextFunction) => {
  const { error } = resetUsageSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  return next();
};

// Middleware para validar importação
export const validateImportLimits = (req: Request, res: Response, next: NextFunction) => {
  const { error } = importLimitsSchema.validate(req.body, { abortEarly: false });
  
  if (error) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  return next();
};

// Middleware para validar parâmetros de plano
export const validatePlanParam = (req: Request, res: Response, next: NextFunction) => {
  const { plan } = req.params;
  const validPlans = ['starter', 'professional', 'enterprise'];
  
  if (!validPlans.includes(plan.toLowerCase())) {
    return res.status(400).json({ 
      message: 'Invalid plan. Must be one of: starter, professional, enterprise' 
    });
  }
  
  return next();
};

// Middleware para validar parâmetros de período
export const validatePeriodParam = (req: Request, res: Response, next: NextFunction) => {
  const { period } = req.query;
  const validPeriods = ['1d', '7d', '30d', '90d', '1y'];
  
  if (period && !validPeriods.includes(period as string)) {
    return res.status(400).json({ 
      message: 'Invalid period. Must be one of: 1d, 7d, 30d, 90d, 1y' 
    });
  }
  
  return next();
};

// Middleware para validar threshold de alertas
export const validateThresholdParam = (req: Request, res: Response, next: NextFunction) => {
  const { threshold } = req.query;
  const thresholdValue = parseInt(threshold as string);
  
  if (threshold && (isNaN(thresholdValue) || thresholdValue < 1 || thresholdValue > 100)) {
    return res.status(400).json({ 
      message: 'Invalid threshold. Must be a number between 1 and 100' 
    });
  }
  
  return next();
};

// Middleware para validar formato de exportação
export const validateExportFormat = (req: Request, res: Response, next: NextFunction) => {
  const { format } = req.query;
  const validFormats = ['json', 'csv'];
  
  if (format && !validFormats.includes(format as string)) {
    return res.status(400).json({ 
      message: 'Invalid format. Must be one of: json, csv' 
    });
  }
  
  return next();
};

// Middleware para validar tenant ID
export const validateTenantId = (req: Request, res: Response, next: NextFunction) => {
  const { tenantId } = req.params;
  
  if (!tenantId || tenantId.trim() === '') {
    return res.status(400).json({ 
      message: 'Tenant ID is required and cannot be empty' 
    });
  }
  
  // Validar formato do tenant ID (deve ser um UUID ou string válida)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const cuidRegex = /^c[a-z0-9]{24}$/i;
  
  if (!uuidRegex.test(tenantId) && !cuidRegex.test(tenantId)) {
    return res.status(400).json({ 
      message: 'Invalid tenant ID format' 
    });
  }
  
  return next();
};

// Middleware para validar limites customizados
export const validateCustomLimits = (req: Request, res: Response, next: NextFunction) => {
  const { limits } = req.body;
  
  if (!limits || typeof limits !== 'object') {
    return res.status(400).json({ 
      message: 'Limits object is required' 
    });
  }
  
  // Validar se pelo menos um tipo de limite está presente
  const hasAILimits = limits.aiLimits && typeof limits.aiLimits === 'object';
  const hasUploadLimits = limits.uploadLimits && typeof limits.uploadLimits === 'object';
  const hasFeatureLimits = limits.featureLimits && typeof limits.featureLimits === 'object';
  const hasRateLimits = limits.rateLimits && typeof limits.rateLimits === 'object';
  
  if (!hasAILimits && !hasUploadLimits && !hasFeatureLimits && !hasRateLimits) {
    return res.status(400).json({ 
      message: 'At least one type of limits must be provided' 
    });
  }
  
  return next();
};

// Middleware para sanitizar dados de entrada
export const sanitizeLimitsData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.aiLimits) {
    // Sanitizar limites de IA
    if (req.body.aiLimits.globalMonthlyTokens) {
      req.body.aiLimits.globalMonthlyTokens = Math.max(0, parseInt(req.body.aiLimits.globalMonthlyTokens));
    }
    
    if (req.body.aiLimits.perServiceType) {
      Object.keys(req.body.aiLimits.perServiceType).forEach(service => {
        const serviceLimits = req.body.aiLimits.perServiceType[service];
        if (serviceLimits.monthlyTokens) {
          serviceLimits.monthlyTokens = Math.max(0, parseInt(serviceLimits.monthlyTokens));
        }
        if (serviceLimits.costBudget) {
          serviceLimits.costBudget = Math.max(0, parseFloat(serviceLimits.costBudget));
        }
      });
    }
  }
  
  if (req.body.uploadLimits) {
    // Sanitizar limites de upload
    if (req.body.uploadLimits.maxFileSizeMB) {
      req.body.uploadLimits.maxFileSizeMB = Math.max(1, parseInt(req.body.uploadLimits.maxFileSizeMB));
    }
    if (req.body.uploadLimits.totalStorageGB) {
      req.body.uploadLimits.totalStorageGB = Math.max(1, parseInt(req.body.uploadLimits.totalStorageGB));
    }
    if (req.body.uploadLimits.monthlyUploadQuotaGB) {
      req.body.uploadLimits.monthlyUploadQuotaGB = Math.max(1, parseInt(req.body.uploadLimits.monthlyUploadQuotaGB));
    }
    if (req.body.uploadLimits.allowedFileTypes) {
      req.body.uploadLimits.allowedFileTypes = req.body.uploadLimits.allowedFileTypes
        .filter((type: string) => typeof type === 'string' && type.trim() !== '')
        .map((type: string) => type.toLowerCase().trim());
    }
  }
  
  if (req.body.rateLimits) {
    // Sanitizar rate limits
    if (req.body.rateLimits.apiRequestsPerMinute) {
      req.body.rateLimits.apiRequestsPerMinute = Math.max(1, parseInt(req.body.rateLimits.apiRequestsPerMinute));
    }
    if (req.body.rateLimits.webhookCallsPerMinute) {
      req.body.rateLimits.webhookCallsPerMinute = Math.max(1, parseInt(req.body.rateLimits.webhookCallsPerMinute));
    }
  }
  
  if (req.body.featureLimits) {
    // Sanitizar feature limits
    Object.keys(req.body.featureLimits).forEach(feature => {
      const value = req.body.featureLimits[feature];
      if (typeof value === 'number') {
        req.body.featureLimits[feature] = Math.max(0, parseInt(value.toString()));
      } else if (typeof value === 'boolean') {
        req.body.featureLimits[feature] = Boolean(value);
      }
    });
  }
  
  next();
};

// Middleware para validar permissões de plano
export const validatePlanPermissions = (req: Request, res: Response, next: NextFunction) => {
  const { plan } = req.params;
  const { method } = req;
  
  // Apenas SUPER_ADMIN pode modificar limites de planos
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    // Verificar se o usuário tem permissão para modificar este plano
    const userRole = req.user?.role;
    
    if (userRole !== 'SUPER_ADMIN') {
      return res.status(403).json({ 
        message: 'Insufficient permissions to modify plan limits' 
      });
    }
  }
  
  return next();
};

export default {
  validateGlobalLimits,
  validateTenantOverride,
  validateCheckLimit,
  validateResetUsage,
  validateImportLimits,
  validatePlanParam,
  validatePeriodParam,
  validateThresholdParam,
  validateExportFormat,
  validateTenantId,
  validateCustomLimits,
  sanitizeLimitsData,
  validatePlanPermissions
};

