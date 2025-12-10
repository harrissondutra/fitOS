import { Router } from 'express';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/superAdmin';
import { asyncHandler } from '../utils/asyncHandler';
import { aiCostTrackingService } from '../services/ai-cost-tracking.service';
import { getAllModels, getProviderStats } from '../config/ai-pricing';

const router = Router();

// Apply authentication middleware to all routes in this router (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  authMiddleware.requireAuth()(req, res, next);
});
router.use(requireSuperAdmin);

// GET /api/super-admin/ai-costs/summary
// Obtém resumo de custos de IA
router.get('/summary', asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    clientId, 
    provider, 
    model,
    period = '30d' // 7d, 30d, 90d, 1y
  } = req.query;

  // Calcular datas baseado no período
  let start: Date, end: Date = new Date();
  
  switch (period) {
    case '7d':
      start = new Date(end.getTime() - (7 * 24 * 60 * 60 * 1000));
      break;
    case '30d':
      start = new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
      break;
    case '90d':
      start = new Date(end.getTime() - (90 * 24 * 60 * 60 * 1000));
      break;
    case '1y':
      start = new Date(end.getTime() - (365 * 24 * 60 * 60 * 1000));
      break;
    default:
      start = startDate ? new Date(startDate as string) : new Date(end.getTime() - (30 * 24 * 60 * 60 * 1000));
      end = endDate ? new Date(endDate as string) : new Date();
  }

  const summary = await aiCostTrackingService.getCostSummary(
    start,
    end,
    clientId as string,
    provider as string,
    model as string
  );

  // Obter projeção de custos
  const projection = await aiCostTrackingService.getCostProjection(
    clientId as string,
    30
  );

  // Obter alertas ativos
  const alerts = await aiCostTrackingService.getActiveAlerts();

  // Obter estatísticas dos provedores
  const providerStats = getProviderStats();

  res.json({
    success: true,
    data: {
      summary,
      projection,
      alerts,
      providerStats,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      }
    }
  });
}));

// GET /api/super-admin/ai-costs/history
// Obtém histórico de custos com paginação
router.get('/history', asyncHandler(async (req, res) => {
  const { 
    page = '1', 
    limit = '50', 
    clientId, 
    provider, 
    model, 
    startDate, 
    endDate 
  } = req.query;

  const history = await aiCostTrackingService.getCostHistory(
    parseInt(page as string),
    parseInt(limit as string),
    {
      clientId: clientId as string,
      provider: provider as string,
      model: model as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    }
  );

  res.json({
    success: true,
    data: history
  });
}));

// GET /api/super-admin/ai-costs/models
// Lista todos os modelos disponíveis com preços
router.get('/models', asyncHandler(async (req, res) => {
  const models = getAllModels();
  const providerStats = getProviderStats();

  res.json({
    success: true,
    data: {
      models,
      providerStats
    }
  });
}));

// GET /api/super-admin/ai-costs/alerts
// Obtém alertas de custos
router.get('/alerts', asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();
  const { clientId, alertType, isActive = 'true' } = req.query;

  const where: any = {};
  if (clientId) where.clientId = clientId;
  if (alertType) where.alertType = alertType;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const alerts = await prisma.costAlert.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: alerts
  });
}));

// POST /api/super-admin/ai-costs/limits
// Define limite de custos para um cliente
router.post('/limits', asyncHandler(async (req, res) => {
  const { clientId, monthlyLimit, currency = 'USD' } = req.body;

  if (!clientId || !monthlyLimit) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'clientId e monthlyLimit são obrigatórios'
    });
  }

  const limit = await aiCostTrackingService.setClientCostLimit(
    clientId,
    parseFloat(monthlyLimit),
    currency
  );

  res.json({
    success: true,
    data: limit
  });
}));

// GET /api/super-admin/ai-costs/limits/:clientId
// Obtém limite de custos de um cliente
router.get('/limits/:clientId', asyncHandler(async (req, res) => {
  const { clientId } = req.params;

  const limit = await aiCostTrackingService.getClientCostLimit(clientId);

  if (!limit) {
    return res.status(404).json({
      success: false,
      error: 'LIMIT_NOT_FOUND',
      message: 'Limite de custos não encontrado para este cliente'
    });
  }

  res.json({
    success: true,
    data: limit
  });
}));

// GET /api/super-admin/ai-costs/projection
// Obtém projeção de custos
router.get('/projection', asyncHandler(async (req, res) => {
  const { clientId, days = '30' } = req.query;

  const projection = await aiCostTrackingService.getCostProjection(
    clientId as string,
    parseInt(days as string)
  );

  res.json({
    success: true,
    data: projection
  });
}));

// POST /api/super-admin/ai-costs/export
// Exporta relatório de custos
router.post('/export', asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    format = 'CSV', 
    clientId 
  } = req.body;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'startDate e endDate são obrigatórios'
    });
  }

  const report = await aiCostTrackingService.exportCostReport(
    new Date(startDate),
    new Date(endDate),
    format as 'CSV' | 'JSON',
    clientId
  );

  const filename = `ai-costs-report-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`;

  res.setHeader('Content-Type', format === 'CSV' ? 'text/csv' : 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(report);
}));

// POST /api/super-admin/ai-costs/track
// Registra uso de IA (para testes ou integração)
router.post('/track', asyncHandler(async (req, res) => {
  const { 
    clientId, 
    model, 
    provider, 
    inputTokens, 
    outputTokens, 
    isCacheHit = false,
    metadata = {} 
  } = req.body;

  if (!clientId || !model || !provider || !inputTokens || !outputTokens) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'clientId, model, provider, inputTokens e outputTokens são obrigatórios'
    });
  }

  const tracking = await aiCostTrackingService.trackUsage({
    clientId,
    model,
    provider,
    inputTokens: parseInt(inputTokens),
    outputTokens: parseInt(outputTokens),
    isCacheHit,
    metadata
  });

  res.json({
    success: true,
    data: tracking
  });
}));

// PUT /api/super-admin/ai-costs/alerts/:alertId/dismiss
// Dispensa um alerta
router.put('/alerts/:alertId/dismiss', asyncHandler(async (req, res) => {
  const prisma = getPrismaClient();
  const { alertId } = req.params;

  const alert = await prisma.costAlert.update({
    where: { id: alertId },
    data: { isActive: false }
  });

  res.json({
    success: true,
    data: alert
  });
}));

export default router;