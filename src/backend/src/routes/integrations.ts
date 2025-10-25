import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { integrationService } from '../services/integration.service';
import { globalLimitsService } from '../services/global-limits.service';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { validateIntegration, validateGlobalLimits } from '../middleware/validation';
import { 
  CreateIntegrationDTO, 
  UpdateIntegrationDTO, 
  UsageLogDTO,
  CreateGlobalLimitsDTO,
  UpdateGlobalLimitsDTO,
  CreateTenantOverrideDTO
} from '../../../shared/types/integrations.types';
// import statusRouter from './integrations/status';

const router = Router();
const prisma = new PrismaClient();
const authMiddleware = new AuthMiddleware(prisma);

// Apply SUPER_ADMIN middleware to all routes
router.use((req: any, res, next) => authMiddleware.requireSuperAdmin(req, res, next));

// Mount status router (no auth required for status checks)
// router.use('/status', statusRouter);

// ===== INTEGRATION ROUTES =====

/**
 * GET /api/super-admin/integrations
 * List all integrations
 */
router.get('/', async (req, res) => {
  try {
    const integrations = await integrationService.findAll();
    return res.json({
      integrations,
      total: integrations.length
    });
  } catch (error) {
    console.error('Error listing integrations:', error);
    return res.status(500).json({ error: 'Failed to list integrations' });
  }
});

/**
 * POST /api/super-admin/integrations
 * Create new integration
 */
router.post('/', validateIntegration, async (req, res) => {
  try {
    const data: CreateIntegrationDTO = req.body;
    const createdBy = req.user?.id || 'system';
    
    const integration = await integrationService.create(data, createdBy);
    return res.status(201).json(integration);
  } catch (error) {
    console.error('Error creating integration:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/integrations/:integration
 * Get specific integration
 */
router.get('/:integration', async (req, res) => {
  try {
    const { integration } = req.params;
    const integrationConfig = await integrationService.findOne(integration);
    
    if (!integrationConfig) {
      return res.status(404).json({ error: 'Integration not found' });
    }
    
    return res.json(integrationConfig);
  } catch (error) {
    console.error('Error getting integration:', error);
    return res.status(500).json({ error: 'Failed to get integration' });
  }
});

/**
 * PUT /api/super-admin/integrations/:integration
 * Update integration
 */
router.put('/:integration', validateIntegration, async (req, res) => {
  try {
    const { integration } = req.params;
    const data: UpdateIntegrationDTO = req.body;
    
    const updatedIntegration = await integrationService.update(integration, data);
    return res.json(updatedIntegration);
  } catch (error) {
    console.error('Error updating integration:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * DELETE /api/super-admin/integrations/:integration
 * Delete integration
 */
router.delete('/:integration', async (req, res) => {
  try {
    const { integration } = req.params;
    await integrationService.delete(integration);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting integration:', error);
    return res.status(500).json({ error: 'Failed to delete integration' });
  }
});

/**
 * GET /api/super-admin/integrations/:integration/config
 * Get decrypted configuration
 */
router.get('/:integration/config', async (req, res) => {
  try {
    const { integration } = req.params;
    const config = await integrationService.getConfig(integration);
    return res.json(config);
  } catch (error) {
    console.error('Error getting integration config:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * PUT /api/super-admin/integrations/:integration/config
 * Update configuration
 */
router.put('/:integration/config', async (req, res) => {
  try {
    const { integration } = req.params;
    const config = req.body;
    
    const updatedIntegration = await integrationService.updateConfig(integration, config);
    return res.json(updatedIntegration);
  } catch (error) {
    console.error('Error updating integration config:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/super-admin/integrations/:integration/test
 * Test connection
 */
router.post('/:integration/test', async (req, res) => {
  try {
    const { integration } = req.params;
    const result = await integrationService.testConnection(integration);
    return res.json(result);
  } catch (error) {
    console.error('Error testing integration connection:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/integrations/:integration/usage
 * Get usage statistics
 */
router.get('/:integration/usage', async (req, res) => {
  try {
    const { integration } = req.params;
    const { period = '30d' } = req.query;
    
    const usage = await integrationService.getUsageStats(integration, period as string);
    return res.json(usage);
  } catch (error) {
    console.error('Error getting integration usage:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/integrations/:integration/logs
 * Get usage logs
 */
router.get('/:integration/logs', async (req, res) => {
  try {
    const { integration } = req.params;
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      eventType: req.query.eventType as string,
      status: req.query.status as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };
    
    const logs = await integrationService.getUsageLogs(integration, filters);
    return res.json({ logs, total: logs.length });
  } catch (error) {
    console.error('Error getting integration logs:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/super-admin/integrations/:integration/logs
 * Log usage
 */
router.post('/:integration/logs', async (req, res) => {
  try {
    const { integration } = req.params;
    const data: UsageLogDTO = req.body;
    
    await integrationService.logUsage(integration, data);
    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Error logging integration usage:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/integrations/:integration/instructions
 * Get test instructions
 */
router.get('/:integration/instructions', async (req, res) => {
  try {
    const { integration } = req.params;
    const instructions = await integrationService.getTestInstructions(integration);
    return res.json(instructions);
  } catch (error) {
    console.error('Error getting test instructions:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/integrations/:integration/metadata
 * Get metadata
 */
router.get('/:integration/metadata', async (req, res) => {
  try {
    const { integration } = req.params;
    const metadata = await integrationService.getMetadata(integration);
    return res.json(metadata);
  } catch (error) {
    console.error('Error getting integration metadata:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * PUT /api/super-admin/integrations/:integration/metadata
 * Update metadata
 */
router.put('/:integration/metadata', async (req, res) => {
  try {
    const { integration } = req.params;
    const metadata = req.body;
    
    await integrationService.updateMetadata(integration, metadata);
    return res.json({ success: true });
  } catch (error) {
    console.error('Error updating integration metadata:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ===== GLOBAL LIMITS ROUTES =====

/**
 * GET /api/super-admin/global-limits
 * List all global limits configurations
 */
router.get('/global-limits', async (req, res) => {
  try {
    const limits = await globalLimitsService.findAll();
    return res.json({ limits, total: limits.length });
  } catch (error) {
    console.error('Error listing global limits:', error);
    return res.status(500).json({ error: 'Failed to list global limits' });
  }
});

/**
 * POST /api/super-admin/global-limits
 * Create global limits configuration
 */
router.post('/global-limits', validateGlobalLimits, async (req, res) => {
  try {
    const data: CreateGlobalLimitsDTO = req.body;
    const limits = await globalLimitsService.create(data);
    return res.status(201).json(limits);
  } catch (error) {
    console.error('Error creating global limits:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/global-limits/:plan
 * Get global limits for specific plan
 */
router.get('/global-limits/:plan', async (req, res) => {
  try {
    const { plan } = req.params;
    const limits = await globalLimitsService.findByPlan(plan);
    
    if (!limits) {
      return res.status(404).json({ error: 'Global limits not found for plan' });
    }
    
    return res.json(limits);
  } catch (error) {
    console.error('Error getting global limits:', error);
    return res.status(500).json({ error: 'Failed to get global limits' });
  }
});

/**
 * PUT /api/super-admin/global-limits/:plan
 * Update global limits for plan
 */
router.put('/global-limits/:plan', validateGlobalLimits, async (req, res) => {
  try {
    const { plan } = req.params;
    const data: UpdateGlobalLimitsDTO = req.body;
    
    const limits = await globalLimitsService.update(plan, data);
    return res.json(limits);
  } catch (error) {
    console.error('Error updating global limits:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * DELETE /api/super-admin/global-limits/:plan
 * Delete global limits for plan
 */
router.delete('/global-limits/:plan', async (req, res) => {
  try {
    const { plan } = req.params;
    await globalLimitsService.delete(plan);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting global limits:', error);
    return res.status(500).json({ error: 'Failed to delete global limits' });
  }
});

/**
 * GET /api/super-admin/global-limits/:plan/effective/:tenantId
 * Get effective limits for tenant
 */
router.get('/global-limits/:plan/effective/:tenantId', async (req, res) => {
  try {
    const { plan, tenantId } = req.params;
    const limits = await globalLimitsService.getEffectiveLimits(tenantId, plan);
    return res.json(limits);
  } catch (error) {
    console.error('Error getting effective limits:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/super-admin/global-limits/validate/ai
 * Validate AI usage
 */
router.post('/global-limits/validate/ai', async (req, res) => {
  try {
    const { tenantId, plan, usage } = req.body;
    const result = await globalLimitsService.validateAIUsage(tenantId, plan, usage);
    return res.json(result);
  } catch (error) {
    console.error('Error validating AI usage:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/super-admin/global-limits/validate/upload
 * Validate upload
 */
router.post('/global-limits/validate/upload', async (req, res) => {
  try {
    const { tenantId, plan, upload } = req.body;
    const result = await globalLimitsService.validateUpload(tenantId, plan, upload);
    return res.json(result);
  } catch (error) {
    console.error('Error validating upload:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/super-admin/global-limits/validate/feature
 * Validate feature access
 */
router.post('/global-limits/validate/feature', async (req, res) => {
  try {
    const { tenantId, plan, feature } = req.body;
    const result = await globalLimitsService.validateFeatureAccess(tenantId, plan, feature);
    return res.json(result);
  } catch (error) {
    console.error('Error validating feature access:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * POST /api/super-admin/global-limits/validate/rate-limit
 * Validate rate limit
 */
router.post('/global-limits/validate/rate-limit', async (req, res) => {
  try {
    const { tenantId, plan, requestType } = req.body;
    const result = await globalLimitsService.validateRateLimit(tenantId, plan, requestType);
    return res.json(result);
  } catch (error) {
    console.error('Error validating rate limit:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/global-limits/comparison
 * Get plan comparison
 */
router.get('/global-limits/comparison', async (req, res) => {
  try {
    const comparison = await globalLimitsService.getPlanComparison();
    return res.json(comparison);
  } catch (error) {
    console.error('Error getting plan comparison:', error);
    return res.status(500).json({ error: 'Failed to get plan comparison' });
  }
});

/**
 * POST /api/super-admin/global-limits/initialize
 * Initialize default limits
 */
router.post('/global-limits/initialize', async (req, res) => {
  try {
    await globalLimitsService.initializeDefaultLimits();
    return res.json({ success: true, message: 'Default limits initialized successfully' });
  } catch (error) {
    console.error('Error initializing default limits:', error);
    return res.status(500).json({ error: 'Failed to initialize default limits' });
  }
});

// ===== TENANT OVERRIDE ROUTES =====

/**
 * GET /api/super-admin/tenant-overrides
 * List all tenant overrides
 */
router.get('/tenant-overrides', async (req, res) => {
  try {
    const filters = {
      plan: req.query.plan as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };
    
    const overrides = await globalLimitsService.getAllTenantOverrides(filters);
    return res.json({ overrides, total: overrides.length });
  } catch (error) {
    console.error('Error listing tenant overrides:', error);
    return res.status(500).json({ error: 'Failed to list tenant overrides' });
  }
});

/**
 * POST /api/super-admin/tenant-overrides
 * Create tenant override
 */
router.post('/tenant-overrides', async (req, res) => {
  try {
    const data: CreateTenantOverrideDTO = req.body;
    const override = await globalLimitsService.createTenantOverride(data);
    return res.status(201).json(override);
  } catch (error) {
    console.error('Error creating tenant override:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * GET /api/super-admin/tenant-overrides/:tenantId
 * Get tenant override
 */
router.get('/tenant-overrides/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const override = await globalLimitsService.getTenantOverride(tenantId);
    
    if (!override) {
      return res.status(404).json({ error: 'Tenant override not found' });
    }
    
    return res.json(override);
  } catch (error) {
    console.error('Error getting tenant override:', error);
    return res.status(500).json({ error: 'Failed to get tenant override' });
  }
});

/**
 * PUT /api/super-admin/tenant-overrides/:tenantId
 * Update tenant override
 */
router.put('/tenant-overrides/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const data = req.body;
    
    const override = await globalLimitsService.updateTenantOverride(tenantId, data);
    return res.json(override);
  } catch (error) {
    console.error('Error updating tenant override:', error);
    return res.status(400).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/**
 * DELETE /api/super-admin/tenant-overrides/:tenantId
 * Delete tenant override
 */
router.delete('/tenant-overrides/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    await globalLimitsService.deleteTenantOverride(tenantId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting tenant override:', error);
    return res.status(500).json({ error: 'Failed to delete tenant override' });
  }
});

/**
 * GET /api/super-admin/tenant-overrides/:tenantId/usage
 * Get tenant usage statistics
 */
router.get('/tenant-overrides/:tenantId/usage', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { period = '30d' } = req.query;
    
    const usage = await globalLimitsService.getTenantUsageStats(tenantId, period as string);
    return res.json(usage);
  } catch (error) {
    console.error('Error getting tenant usage stats:', error);
    return res.status(500).json({ error: 'Failed to get tenant usage stats' });
  }
});

export default router;


