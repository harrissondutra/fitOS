/**
 * AI Predictions API Routes
 * 
 * Rotas para execução e gerenciamento de predições de IA
 */

import { Router, Request, Response } from 'express';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
import { AiServiceType } from '../../../shared/types/ai.types';
import { asyncHandler } from '../utils/async-handler';
import { getPrismaClient } from '../config/database';

const router = Router();

// Middleware de tenant (requireSuperAdmin já é aplicado no router central)
// Note: Para super-admin, tenantId pode ser obtido do request ou do body

/**
 * POST /api/super-admin/ai/predictions/:type/analyze
 * Executa uma predição de um tipo específico
 */
router.post('/:type/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const serviceType = type.toUpperCase().replace(/-/g, '_') as AiServiceType;

  // Validar tipo de serviço
  if (!Object.values(AiServiceType).includes(serviceType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid prediction type: ${type}`
    });
  }

  // Verificar se é um tipo de predição
  const predictionTypes = [
    AiServiceType.PERFORMANCE_PREDICTION,
    AiServiceType.RECOVERY_TIME_PREDICTION,
    AiServiceType.MUSCLE_GAIN_PREDICTION,
    AiServiceType.STRENGTH_PREDICTION,
    AiServiceType.WEIGHT_LOSS_PREDICTION,
    AiServiceType.ADHERENCE_PREDICTION,
    // Adicionar todos os tipos preditivos
  ];

  if (!predictionTypes.includes(serviceType)) {
    return res.status(400).json({
      success: false,
      error: `${serviceType} is not a prediction service type`
    });
  }

  const prisma = getPrismaClient();
  const service = new PredictiveAnalyticsService(prisma);

  // Obter tenantId do body, query ou contexto do super-admin
  const tenantId = req.body.tenantId || req.query.tenantId as string || req.tenantId || 'system';

  const result = await service.executePrediction({
    serviceType,
    tenantId,
    userId: req.user?.id || req.body.userId,
    data: req.body.data || req.body
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/super-admin/ai/predictions/:executionId/validate
 * Registra resultado real para validação da predição
 */
router.post('/:executionId/validate', asyncHandler(async (req: Request, res: Response) => {
  const { executionId } = req.params;
  const { actualResult } = req.body;

  if (!actualResult) {
    return res.status(400).json({
      success: false,
      error: 'actualResult is required'
    });
  }

  const prisma = getPrismaClient();
  const service = new PredictiveAnalyticsService(prisma);

  await service.validatePrediction(executionId, actualResult);

  res.json({
    success: true,
    message: 'Prediction validated successfully'
  });
}));

/**
 * GET /api/super-admin/ai/predictions
 * Lista execuções de predições
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const serviceType = req.query.serviceType as AiServiceType | undefined;
  const userId = req.query.userId as string | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const prisma = getPrismaClient();
  const service = new PredictiveAnalyticsService(prisma);

  // Obter tenantId do body, query ou contexto do super-admin
  const tenantId = req.body.tenantId || req.query.tenantId as string || req.tenantId || 'system';

  const result = await service.listExecutions(
    tenantId,
    {
      serviceType,
      userId,
      startDate,
      endDate
    },
    { page, limit }
  );

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination
  });
}));

/**
 * GET /api/super-admin/ai/predictions/:executionId
 * Obtém detalhes de uma execução específica
 */
router.get('/:executionId', asyncHandler(async (req: Request, res: Response) => {
  const { executionId } = req.params;

  const prisma = getPrismaClient();
  // Obter tenantId do body, query ou contexto do super-admin
  const tenantId = req.body.tenantId || req.query.tenantId as string || req.tenantId;

  const execution = await prisma.predictionExecution.findFirst({
    where: {
      id: executionId,
      ...(tenantId && { tenantId })
    },
    include: {
      model: true
    }
  });

  if (!execution) {
    return res.status(404).json({
      success: false,
      error: 'Prediction execution not found'
    });
  }

  res.json({
    success: true,
    data: execution
  });
}));

export default router;

