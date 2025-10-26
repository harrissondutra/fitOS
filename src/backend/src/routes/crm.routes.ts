/**
 * CRM API Routes - FitOS Sprint 4
 * 
 * Rotas completas para o módulo CRM com autenticação JWT e validação.
 */

import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { 
  crmPipelineService,
  dealService,
  automationWorkflowService
} from '../services/crm';

const router = Router();

// ============================================================================
// CRM PIPELINE ROUTES
// ============================================================================

/**
 * POST /api/crm/pipelines
 * Cria novo pipeline de CRM
 */
router.post('/pipelines', authenticateToken, validateRequest('crmPipelineCreate'), async (req, res) => {
  try {
    const pipelineData = {
      ...req.body,
      tenantId: req.user.tenantId
    };

    const pipeline = await crmPipelineService.createPipeline(pipelineData);
    
    res.status(201).json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    console.error('Error creating CRM pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/pipelines
 * Lista pipelines de CRM
 */
router.get('/pipelines', authenticateToken, async (req, res) => {
  try {
    const { isActive, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const pipelines = await crmPipelineService.getPipelines(filters);
    
    res.json({
      success: true,
      data: pipelines
    });
  } catch (error) {
    console.error('Error getting CRM pipelines:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/pipelines/:id
 * Busca pipeline específico
 */
router.get('/pipelines/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pipeline = await crmPipelineService.getPipelineById(id);
    
    if (!pipeline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Pipeline not found' 
      });
    }

    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    console.error('Error getting CRM pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/pipelines/default
 * Busca pipeline padrão do tenant
 */
router.get('/pipelines/default', authenticateToken, async (req, res) => {
  try {
    const pipeline = await crmPipelineService.getDefaultPipeline(req.user.tenantId);
    
    if (!pipeline) {
      return res.status(404).json({ 
        success: false, 
        error: 'Default pipeline not found' 
      });
    }

    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    console.error('Error getting default CRM pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/crm/pipelines/:id
 * Atualiza pipeline
 */
router.put('/pipelines/:id', authenticateToken, validateRequest('crmPipelineUpdate'), async (req, res) => {
  try {
    const { id } = req.params;
    const pipeline = await crmPipelineService.updatePipeline({ id, ...req.body });
    
    res.json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    console.error('Error updating CRM pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/crm/pipelines/:id
 * Remove pipeline
 */
router.delete('/pipelines/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await crmPipelineService.deletePipeline(id);
    
    res.json({
      success: true,
      message: 'Pipeline deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting CRM pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/crm/pipelines/:id/duplicate
 * Duplica pipeline existente
 */
router.post('/pipelines/:id/duplicate', authenticateToken, validateRequest('crmPipelineDuplicate'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const pipeline = await crmPipelineService.duplicatePipeline(id, name);
    
    res.status(201).json({
      success: true,
      data: pipeline
    });
  } catch (error) {
    console.error('Error duplicating CRM pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/pipelines/:id/stats
 * Busca estatísticas do pipeline
 */
router.get('/pipelines/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await crmPipelineService.getPipelineStats(id);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting CRM pipeline stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// DEAL ROUTES
// ============================================================================

/**
 * POST /api/crm/deals
 * Cria novo negócio
 */
router.post('/deals', authenticateToken, validateRequest('dealCreate'), async (req, res) => {
  try {
    const dealData = {
      ...req.body,
      tenantId: req.user.tenantId
    };

    const deal = await dealService.createDeal(dealData);
    
    res.status(201).json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/deals
 * Lista negócios
 */
router.get('/deals', authenticateToken, async (req, res) => {
  try {
    const { 
      pipelineId, 
      clientId, 
      assignedTo, 
      status, 
      stage, 
      priority,
      startDate,
      endDate,
      limit = 20, 
      offset = 0 
    } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      pipelineId: pipelineId as string,
      clientId: clientId as string,
      assignedTo: assignedTo as string,
      status: status as string,
      stage: stage as string,
      priority: priority as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const deals = await dealService.getDeals(filters);
    
    res.json({
      success: true,
      data: deals
    });
  } catch (error) {
    console.error('Error getting deals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/deals/:id
 * Busca negócio específico
 */
router.get('/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await dealService.getDealById(id);
    
    if (!deal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Deal not found' 
      });
    }

    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error getting deal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/crm/deals/:id
 * Atualiza negócio
 */
router.put('/deals/:id', authenticateToken, validateRequest('dealUpdate'), async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await dealService.updateDeal({ id, ...req.body });
    
    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/crm/deals/:id
 * Remove negócio
 */
router.delete('/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await dealService.deleteDeal(id);
    
    res.json({
      success: true,
      message: 'Deal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/crm/deals/:id/advance
 * Move negócio para próximo estágio
 */
router.post('/deals/:id/advance', authenticateToken, validateRequest('dealAdvance'), async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;

    const deal = await dealService.advanceDeal(id, stage, notes);
    
    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error advancing deal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/crm/deals/:id/close
 * Fecha negócio (won/lost)
 */
router.post('/deals/:id/close', authenticateToken, validateRequest('dealClose'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const deal = await dealService.closeDeal(id, status, notes);
    
    res.json({
      success: true,
      data: deal
    });
  } catch (error) {
    console.error('Error closing deal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/deals/stats
 * Busca estatísticas de negócios
 */
router.get('/deals/stats', authenticateToken, async (req, res) => {
  try {
    const { 
      pipelineId, 
      clientId, 
      assignedTo, 
      status, 
      stage, 
      priority,
      startDate,
      endDate
    } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      pipelineId: pipelineId as string,
      clientId: clientId as string,
      assignedTo: assignedTo as string,
      status: status as string,
      stage: stage as string,
      priority: priority as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    };

    const stats = await dealService.getDealStats(filters);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting deal stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/deals/upcoming
 * Busca negócios próximos do vencimento
 */
router.get('/deals/upcoming', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const deals = await dealService.getUpcomingDeals(req.user.tenantId, parseInt(days as string));
    
    res.json({
      success: true,
      data: deals
    });
  } catch (error) {
    console.error('Error getting upcoming deals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// AUTOMATION WORKFLOW ROUTES
// ============================================================================

/**
 * POST /api/crm/automations
 * Cria novo workflow de automação
 */
router.post('/automations', authenticateToken, validateRequest('automationWorkflowCreate'), async (req, res) => {
  try {
    const workflowData = {
      ...req.body,
      tenantId: req.user.tenantId
    };

    const workflow = await automationWorkflowService.createWorkflow(workflowData);
    
    res.status(201).json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error creating automation workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/automations
 * Lista workflows de automação
 */
router.get('/automations', authenticateToken, async (req, res) => {
  try {
    const { isActive, triggerType, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      isActive: isActive ? isActive === 'true' : undefined,
      triggerType: triggerType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const workflows = await automationWorkflowService.getWorkflows(filters);
    
    res.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    console.error('Error getting automation workflows:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/automations/:id
 * Busca workflow específico
 */
router.get('/automations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await automationWorkflowService.getWorkflowById(id);
    
    if (!workflow) {
      return res.status(404).json({ 
        success: false, 
        error: 'Automation workflow not found' 
      });
    }

    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error getting automation workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/crm/automations/:id
 * Atualiza workflow
 */
router.put('/automations/:id', authenticateToken, validateRequest('automationWorkflowUpdate'), async (req, res) => {
  try {
    const { id } = req.params;
    const workflow = await automationWorkflowService.updateWorkflow({ id, ...req.body });
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    console.error('Error updating automation workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/crm/automations/:id
 * Remove workflow
 */
router.delete('/automations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await automationWorkflowService.deleteWorkflow(id);
    
    res.json({
      success: true,
      message: 'Automation workflow deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting automation workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/crm/automations/:id/execute
 * Executa workflow manualmente
 */
router.post('/automations/:id/execute', authenticateToken, validateRequest('automationExecute'), async (req, res) => {
  try {
    const { id } = req.params;
    const { triggerData } = req.body;

    const result = await automationWorkflowService.executeWorkflow(id, triggerData);
    
    if (!result) {
      return res.status(400).json({
        success: false,
        error: 'Workflow execution skipped - trigger conditions not met'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error executing automation workflow:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/crm/automations/stats
 * Busca estatísticas de workflows
 */
router.get('/automations/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await automationWorkflowService.getWorkflowStats(req.user.tenantId);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting automation workflow stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// CRM STATISTICS ROUTES
// ============================================================================

/**
 * GET /api/crm/stats/overview
 * Busca estatísticas gerais do CRM
 */
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const [
      pipelineStats,
      dealStats,
      automationStats
    ] = await Promise.all([
      crmPipelineService.getPipelineStats(req.user.tenantId),
      dealService.getDealStats({ tenantId: req.user.tenantId }),
      automationWorkflowService.getWorkflowStats(req.user.tenantId)
    ]);

    const overview = {
      pipelines: pipelineStats,
      deals: dealStats,
      automations: automationStats,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('Error getting CRM overview stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

/**
 * GET /api/crm/health
 * Health check do módulo CRM
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const [
      pipelineHealth,
      dealHealth,
      automationHealth
    ] = await Promise.all([
      crmPipelineService.healthCheck(),
      dealService.healthCheck(),
      automationWorkflowService.healthCheck()
    ]);

    const health = {
      status: 'healthy',
      services: {
        pipeline: pipelineHealth,
        deal: dealHealth,
        automation: automationHealth
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking CRM module health:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
