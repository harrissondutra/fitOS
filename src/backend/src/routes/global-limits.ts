import { Router } from 'express';
import { GlobalLimitsService } from '../services/global-limits.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { validateGlobalLimits } from '../middleware/validation.middleware';
import { getPrismaClient } from '../config/database';

const router = Router();
const globalLimitsService = new GlobalLimitsService();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware para todas as rotas
router.use((req: any, res, next) => authMiddleware.requireSuperAdmin(req, res, next));

// GET /api/super-admin/global-limits
// Listar todos os limites globais
router.get('/', async (req, res) => {
  try {
    const limits = await globalLimitsService.findAll();
    return res.json(limits);
  } catch (error) {
    console.error('Error fetching global limits:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch global limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/super-admin/global-limits/:plan
// Obter limites de um plano específico
router.get('/:plan', async (req, res) => {
  try {
    const { plan } = req.params;
    const limits = await globalLimitsService.findByPlan(plan);
    
    if (!limits) {
      return res.status(404).json({ message: 'Plan limits not found' });
    }
    
    return res.json(limits);
  } catch (error) {
    console.error('Error fetching plan limits:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch plan limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/super-admin/global-limits/:plan
// Atualizar limites de um plano específico
router.put('/:plan', validateGlobalLimits, async (req, res) => {
  try {
    const { plan } = req.params;
    const limitsData = req.body;
    
    const updatedLimits = await globalLimitsService.update(plan, limitsData);
    return res.json(updatedLimits);
  } catch (error) {
    console.error('Error updating plan limits:', error);
    return res.status(500).json({ 
      message: 'Failed to update plan limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/super-admin/global-limits/:plan
// Criar limites para um novo plano
router.post('/:plan', validateGlobalLimits, async (req, res) => {
  try {
    const { plan } = req.params;
    const limitsData = req.body;
    
    const newLimits = await globalLimitsService.create(limitsData);
    return res.status(201).json(newLimits);
  } catch (error) {
    console.error('Error creating plan limits:', error);
    return res.status(500).json({ 
      message: 'Failed to create plan limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/super-admin/global-limits/:plan
// Deletar limites de um plano
router.delete('/:plan', async (req, res) => {
  try {
    const { plan } = req.params;
    
    await globalLimitsService.delete(plan);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting plan limits:', error);
    return res.status(500).json({ 
      message: 'Failed to delete plan limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/super-admin/global-limits/overrides
// Listar todos os overrides
router.get('/overrides', async (req, res) => {
  try {
    const { tenantId } = req.query;
    const overrides = await globalLimitsService.getAllTenantOverrides();
    return res.json(overrides);
  } catch (error) {
    console.error('Error fetching tenant overrides:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch tenant overrides',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/super-admin/global-limits/overrides
// Criar override para um tenant
router.post('/overrides', async (req, res) => {
  try {
    const { tenantId, overrides } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    const newOverride = await globalLimitsService.createTenantOverride({ tenantId, ...overrides });
    return res.status(201).json(newOverride);
  } catch (error) {
    console.error('Error creating tenant override:', error);
    return res.status(500).json({ 
      message: 'Failed to create tenant override',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/super-admin/global-limits/overrides/:id
// Obter override específico
router.get('/overrides/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const override = await globalLimitsService.getTenantOverride(id);
    
    if (!override) {
      return res.status(404).json({ message: 'Override not found' });
    }
    
    return res.json(override);
  } catch (error) {
    console.error('Error fetching override:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch override',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/super-admin/global-limits/overrides/:id
// Atualizar override
router.put('/overrides/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const overridesData = req.body;
    
    const updatedOverride = await globalLimitsService.updateTenantOverride(id, overridesData);
    return res.json(updatedOverride);
  } catch (error) {
    console.error('Error updating override:', error);
    return res.status(500).json({ 
      message: 'Failed to update override',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/super-admin/global-limits/overrides/:id
// Deletar override
router.delete('/overrides/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await globalLimitsService.deleteTenantOverride(id);
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting override:', error);
    return res.status(500).json({ 
      message: 'Failed to delete override',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/super-admin/global-limits/validate
// Validar limites antes de aplicar
router.post('/validate', async (req, res) => {
  try {
    const { plan, limits } = req.body;
    
    // TODO: Implementar validação de limites
    const validation = { valid: true, message: 'Validation not implemented yet' };
    return res.json(validation);
  } catch (error) {
    console.error('Error validating limits:', error);
    return res.status(500).json({ 
      message: 'Failed to validate limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/super-admin/global-limits/usage/:plan
// Obter estatísticas de uso para um plano
router.get('/usage/:plan', async (req, res) => {
  try {
    const { plan } = req.params;
    const { period = '30d' } = req.query;
    
    // TODO: Implementar estatísticas de uso do plano
    const usage = { plan, period, stats: {} };
    return res.json(usage);
  } catch (error) {
    console.error('Error fetching plan usage:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch plan usage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/super-admin/global-limits/tenants/:tenantId/usage
// Obter estatísticas de uso para um tenant específico
router.get('/tenants/:tenantId/usage', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { period = '30d' } = req.query;
    
    const usage = await globalLimitsService.getTenantUsageStats(tenantId, period as string);
    return res.json(usage);
  } catch (error) {
    console.error('Error fetching tenant usage:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch tenant usage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/super-admin/global-limits/check-limit
// Verificar se um tenant pode executar uma ação
router.post('/check-limit', async (req, res) => {
  try {
    const { tenantId, action, resource, amount = 1 } = req.body;
    
    if (!tenantId || !action || !resource) {
      return res.status(400).json({ 
        message: 'Tenant ID, action, and resource are required' 
      });
    }
    
    // TODO: Implementar verificação de limite
    const canExecute = { allowed: true, reason: 'Check not implemented yet' };
    return res.json({ 
      canExecute,
      tenantId,
      action,
      resource,
      amount
    });
  } catch (error) {
    console.error('Error checking limit:', error);
    return res.status(500).json({ 
      message: 'Failed to check limit',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/super-admin/global-limits/alerts
// Obter alertas de limites próximos
router.get('/alerts', async (req, res) => {
  try {
    const { threshold = 80 } = req.query;
    // TODO: Implementar alertas de limite
    const alerts = [];
    return res.json(alerts);
  } catch (error) {
    console.error('Error fetching limit alerts:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch limit alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/super-admin/global-limits/reset-usage
// Resetar uso de um tenant (para testes ou correções)
router.post('/reset-usage', async (req, res) => {
  try {
    const { tenantId, period = 'current' } = req.body;
    
    if (!tenantId) {
      return res.status(400).json({ message: 'Tenant ID is required' });
    }
    
    // TODO: Implementar reset de uso do tenant
    console.log(`Reset usage for tenant ${tenantId}, period: ${period}`);
    return res.json({ message: 'Usage reset successfully' });
  } catch (error) {
    console.error('Error resetting usage:', error);
    return res.status(500).json({ 
      message: 'Failed to reset usage',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/super-admin/global-limits/export
// Exportar configurações de limites
router.get('/export', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // TODO: Implementar exportação de limites
    const exportData = { format, data: [] };
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="global-limits.csv"');
      return res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="global-limits.json"');
      return res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting limits:', error);
    return res.status(500).json({ 
      message: 'Failed to export limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/super-admin/global-limits/import
// Importar configurações de limites
router.post('/import', async (req, res) => {
  try {
    const { data, overwrite = false } = req.body;
    
    if (!data) {
      return res.status(400).json({ message: 'Import data is required' });
    }
    
    // TODO: Implementar importação de limites
    const result = { success: true, imported: 0, errors: [] };
    return res.json(result);
  } catch (error) {
    console.error('Error importing limits:', error);
    return res.status(500).json({
      message: 'Failed to import limits',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

