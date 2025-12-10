/**
 * AI Generators API Routes
 * 
 * Rotas para geração de conteúdo usando IA
 */

import { Router, Request, Response } from 'express';
import { ContentGenerationService } from '../services/content-generation.service';
import { AiServiceType } from '../../../shared/types/ai.types';
import { asyncHandler } from '../utils/async-handler';
import { getPrismaClient } from '../config/database';

const router = Router();

// Middleware de tenant (requireSuperAdmin já é aplicado no router central)
// Note: Para super-admin, tenantId pode ser obtido do request ou do body

/**
 * POST /api/super-admin/ai/generators/:type/generate
 * Gera conteúdo de um tipo específico
 */
router.post('/:type/generate', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  const serviceType = type.toUpperCase().replace(/-/g, '_') as AiServiceType;

  // Validar tipo de serviço
  if (!Object.values(AiServiceType).includes(serviceType)) {
    return res.status(400).json({
      success: false,
      error: `Invalid generator type: ${type}`
    });
  }

  // Verificar se é um tipo de geração
  const generatorTypes = [
    AiServiceType.PERSONALIZED_EMAIL_GENERATION,
    AiServiceType.SOCIAL_MEDIA_CONTENT_GENERATION,
    AiServiceType.PROGRESS_REPORT_GENERATION,
    AiServiceType.MOTIVATIONAL_MESSAGE_GENERATION,
    AiServiceType.ADAPTIVE_WORKOUT_GENERATION,
    AiServiceType.RECIPE_GENERATION,
    // Adicionar todos os tipos generativos
  ];

  if (!generatorTypes.includes(serviceType)) {
    return res.status(400).json({
      success: false,
      error: `${serviceType} is not a generator service type`
    });
  }

  const prisma = getPrismaClient();
  const service = new ContentGenerationService(prisma);

  // Obter tenantId do body, query ou contexto do super-admin
  const tenantId = req.body.tenantId || req.query.tenantId as string || req.tenantId || 'system';

  const result = await service.generateContent({
    serviceType,
    tenantId,
    userId: req.user?.id || req.body.userId,
    input: req.body.input || req.body,
    options: req.body.options
  });

  res.json({
    success: true,
    data: result
  });
}));

/**
 * POST /api/super-admin/ai/generators/:contentId/feedback
 * Submete feedback sobre conteúdo gerado
 */
router.post('/:contentId/feedback', asyncHandler(async (req: Request, res: Response) => {
  const { contentId } = req.params;
  const { rating, comment, improvements } = req.body;

  const prisma = getPrismaClient();
  const service = new ContentGenerationService(prisma);

  await service.submitFeedback(contentId, {
    rating,
    comment,
    improvements
  });

  res.json({
    success: true,
    message: 'Feedback submitted successfully'
  });
}));

/**
 * GET /api/super-admin/ai/generators
 * Lista conteúdo gerado
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const serviceType = req.query.serviceType as AiServiceType | undefined;
  const userId = req.query.userId as string | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const prisma = getPrismaClient();
  const service = new ContentGenerationService(prisma);

  // Obter tenantId do body, query ou contexto do super-admin
  const tenantId = req.body.tenantId || req.query.tenantId as string || req.tenantId || 'system';

  const result = await service.listGeneratedContent(
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
 * GET /api/super-admin/ai/generators/:contentId
 * Obtém detalhes de conteúdo gerado específico
 */
router.get('/:contentId', asyncHandler(async (req: Request, res: Response) => {
  const { contentId } = req.params;

  const prisma = getPrismaClient();
  // Obter tenantId do body, query ou contexto do super-admin
  const tenantId = req.body.tenantId || req.query.tenantId as string || req.tenantId;

  const content = await prisma.generatedContent.findFirst({
    where: {
      id: contentId,
      ...(tenantId && { tenantId })
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
      error: 'Generated content not found'
    });
  }

  res.json({
    success: true,
    data: content
  });
}));

export default router;

