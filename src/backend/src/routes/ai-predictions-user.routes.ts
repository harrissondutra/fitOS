/**
 * AI Predictions User Routes
 * 
 * Rotas para execução de predições por usuários regulares
 * Acesso: CLIENT, TRAINER, ADMIN, OWNER (respeitando limites de plano)
 */

import { Router, Request, Response } from 'express';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
import { AiServiceType } from '../../../shared/types/ai.types';
import { asyncHandler } from '../utils/async-handler';
import { getPrismaClient } from '../config/database';
import { requireAIAccess } from '../middleware/ai-access.middleware';
import { requireRole } from '../middleware/permissions';

const router = Router();

/**
 * POST /api/ai/predictions/:type/analyze
 * Executa uma predição (acesso para CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN)
 */
router.post(
  '/:type/analyze',
  requireAIAccess({ type: 'predictions' }),
  requireRole(['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const serviceType = type.toUpperCase().replace(/-/g, '_') as AiServiceType;

    // Validar tipo de serviço
    if (!Object.values(AiServiceType).includes(serviceType)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de predição inválido: ${type}`
      });
    }

    const prisma = getPrismaClient();
    const service = new PredictiveAnalyticsService(prisma);

    // Obter tenantId do usuário autenticado
    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;
    const userId = req.user?.id || req.aiAccess?.userId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID não encontrado'
      });
    }

    try {
      const result = await service.executePrediction({
        serviceType,
        tenantId,
        userId,
        data: req.body.data || req.body
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      // Erros de limite são tratados no service
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao executar predição'
      });
    }
  })
);

/**
 * GET /api/ai/predictions
 * Lista predições do usuário/tenant (filtrado por role)
 */
router.get(
  '/',
  requireRole(['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  requireAIAccess({ type: 'predictions' }),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const serviceType = req.query.serviceType as AiServiceType | undefined;
    const userId = req.query.userId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const prisma = getPrismaClient();
    const service = new PredictiveAnalyticsService(prisma);

    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;
    const currentUserId = req.user?.id || req.aiAccess?.userId;
    const userRole = req.user?.role;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID não encontrado'
      });
    }

    // CLIENT só vê suas próprias predições
    // TRAINER+ vê predições do tenant
    const filters: any = {
      serviceType,
      startDate,
      endDate
    };

    if (userRole === 'CLIENT') {
      filters.userId = currentUserId; // CLIENT só vê as próprias
    } else if (userRole === 'PROFESSIONAL' || userRole === 'EMPLOYEE') {
      // PROFESSIONAL pode ver predições de seus clientes (futuro)
      filters.userId = userId || currentUserId;
    }
    // ADMIN e OWNER veem todas do tenant

    const result = await service.listExecutions(
      tenantId,
      filters,
      { page, limit }
    );

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  })
);

/**
 * GET /api/ai/predictions/:executionId
 * Obtém detalhes de uma predição específica
 */
router.get(
  '/:executionId',
  requireRole(['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  requireAIAccess({ type: 'predictions' }),
  asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;

    const prisma = getPrismaClient();
    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;
    const currentUserId = req.user?.id || req.aiAccess?.userId;
    const userRole = req.user?.role;

    const execution = await prisma.predictionExecution.findFirst({
      where: {
        id: executionId,
        tenantId,
        // CLIENT só vê suas próprias
        ...(userRole === 'CLIENT' && { userId: currentUserId })
      },
      include: {
        model: true
      }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Predição não encontrada'
      });
    }

    res.json({
      success: true,
      data: execution
    });
  })
);

/**
 * POST /api/ai/predictions/:executionId/validate
 * Registra resultado real para validação (PROFESSIONAL+)
 */
router.post(
  '/:executionId/validate',
  requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { executionId } = req.params;
    const { actualResult } = req.body;

    if (!actualResult) {
      return res.status(400).json({
        success: false,
        error: 'actualResult é obrigatório'
      });
    }

    const prisma = getPrismaClient();
    const service = new PredictiveAnalyticsService(prisma);
    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;

    // Verificar que a predição pertence ao tenant
    const execution = await prisma.predictionExecution.findFirst({
      where: {
        id: executionId,
        tenantId
      }
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        error: 'Predição não encontrada'
      });
    }

    await service.validatePrediction(executionId, actualResult);

    res.json({
      success: true,
      message: 'Predição validada com sucesso'
    });
  })
);

export default router;

