/**
 * AI Generators User Routes
 * 
 * Rotas para geração de conteúdo por usuários regulares
 * Acesso: PROFESSIONAL, ADMIN, SUPER_ADMIN (CLIENT não pode gerar conteúdo)
 */

import { Router, Request, Response } from 'express';
import { ContentGenerationService } from '../services/content-generation.service';
import { AiServiceType } from '../../../shared/types/ai.types';
import { asyncHandler } from '../utils/async-handler';
import { getPrismaClient } from '../config/database';
import { requireAIAccess } from '../middleware/ai-access.middleware';
import { requireRole } from '../middleware/permissions';

const router = Router();

/**
 * POST /api/ai/generators/:type/generate
 * Gera conteúdo (acesso para PROFESSIONAL, ADMIN, SUPER_ADMIN)
 */
router.post(
  '/:type/generate',
  requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  requireAIAccess({ type: 'generation' }),
  asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;
    const serviceType = type.toUpperCase().replace(/-/g, '_') as AiServiceType;

    // Validar tipo de serviço
    if (!Object.values(AiServiceType).includes(serviceType)) {
      return res.status(400).json({
        success: false,
        error: `Tipo de geração inválido: ${type}`
      });
    }

    const prisma = getPrismaClient();
    const service = new ContentGenerationService(prisma);

    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;
    const userId = req.user?.id || req.aiAccess?.userId;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID não encontrado'
      });
    }

    try {
      const result = await service.generateContent({
        serviceType,
        tenantId,
        userId,
        input: req.body.input || req.body,
        options: req.body.options
      });

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      // Erros de limite são tratados no service
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao gerar conteúdo'
      });
    }
  })
);

/**
 * GET /api/ai/generators
 * Lista conteúdo gerado (filtrado por role)
 */
router.get(
  '/',
  requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  requireAIAccess({ type: 'generation' }),
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const serviceType = req.query.serviceType as AiServiceType | undefined;
    const userId = req.query.userId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const prisma = getPrismaClient();
    const service = new ContentGenerationService(prisma);

    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;
    const currentUserId = req.user?.id || req.aiAccess?.userId;
    const userRole = req.user?.role;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant ID não encontrado'
      });
    }

    // PROFESSIONAL vê suas próprias + do tenant (limitado)
    // ADMIN ve todas do tenant
    const filters: any = {
      serviceType,
      startDate,
      endDate
    };

    if (userRole === 'PROFESSIONAL') {
      filters.userId = userId || currentUserId; // PROFESSIONAL vê suas próprias ou filtro específico
    }
    // ADMIN e SUPER_ADMIN veem todas do tenant

    const result = await service.listGeneratedContent(
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
 * GET /api/ai/generators/:contentId
 * Obtém detalhes de conteúdo gerado específico
 */
router.get(
  '/:contentId',
  requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  requireAIAccess({ type: 'generation' }),
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;

    const prisma = getPrismaClient();
    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;
    const currentUserId = req.user?.id || req.aiAccess?.userId;
    const userRole = req.user?.role;

    const content = await prisma.generatedContent.findFirst({
      where: {
        id: contentId,
        tenantId,
        // PROFESSIONAL só vê suas próprias
        ...(userRole === 'PROFESSIONAL' && { userId: currentUserId })
      },
      include: {
        provider: {
          select: {
            id: true,
            displayName: true,
            provider: true
          }
        }
      }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Conteúdo gerado não encontrado'
      });
    }

    res.json({
      success: true,
      data: content
    });
  })
);

/**
 * POST /api/ai/generators/:contentId/feedback
 * Submete feedback sobre conteúdo gerado (PROFESSIONAL+)
 */
router.post(
  '/:contentId/feedback',
  requireRole(['PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN']),
  asyncHandler(async (req: Request, res: Response) => {
    const { contentId } = req.params;
    const { rating, comment, improvements } = req.body;

    if (!rating) {
      return res.status(400).json({
        success: false,
        error: 'Avaliação (rating) é obrigatória'
      });
    }

    const prisma = getPrismaClient();
    const service = new ContentGenerationService(prisma);
    const tenantId = req.user?.tenantId || req.aiAccess?.tenantId;

    // Verificar que o conteúdo pertence ao tenant
    const content = await prisma.generatedContent.findFirst({
      where: {
        id: contentId,
        tenantId
      }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Conteúdo gerado não encontrado'
      });
    }

    await service.submitFeedback(contentId, {
      rating,
      comment,
      improvements
    });

    res.json({
      success: true,
      message: 'Feedback enviado com sucesso'
    });
  })
);

export default router;

