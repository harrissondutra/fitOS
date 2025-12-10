import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PhysicalAssessmentService } from '../services/physical-assessment.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { body, query, param } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const assessmentService = new PhysicalAssessmentService(prisma);

// Extend Request interface
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    role: string;
  };
}

// POST /api/assessments - Criar avaliação física
router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  [
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('assessmentDate').isISO8601().withMessage('Valid assessment date is required')
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const assessment = await assessmentService.createAssessment(
      { ...req.body, trainerId: req.user!.id },
      req.tenantId
    );

    res.status(201).json({
      success: true,
      data: { assessment }
    });
  })
);

// GET /api/assessments/client/:clientId - Histórico de avaliações do cliente
router.get(
  '/client/:clientId',
  authMiddleware,
  tenantMiddleware,
  [param('clientId').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { clientId } = req.params;

    const assessments = await assessmentService.getAssessmentHistory(clientId, req.tenantId);

    res.json({
      success: true,
      data: { assessments }
    });
  })
);

// GET /api/assessments/:id - Buscar avaliação por ID
router.get(
  '/:id',
  authMiddleware,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    const assessment = await assessmentService.getAssessmentById(id, req.tenantId);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      data: { assessment }
    });
  })
);

// GET /api/assessments/compare/:id1/:id2 - Comparar duas avaliações
router.get(
  '/compare/:id1/:id2',
  authMiddleware,
  tenantMiddleware,
  [
    param('id1').isString().notEmpty(),
    param('id2').isString().notEmpty()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id1, id2 } = req.params;

    const comparison = await assessmentService.compareAssessments(id1, id2, req.tenantId);

    res.json({
      success: true,
      data: { comparison }
    });
  })
);

// PUT /api/assessments/:id - Atualizar avaliação
router.put(
  '/:id',
  authMiddleware,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    const assessment = await assessmentService.updateAssessment(id, req.body, req.tenantId);

    res.json({
      success: true,
      data: { assessment }
    });
  })
);

// DELETE /api/assessments/:id - Deletar avaliação
router.delete(
  '/:id',
  authMiddleware,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    await assessmentService.deleteAssessment(id, req.tenantId);

    res.json({
      success: true,
      message: 'Assessment deleted successfully'
    });
  })
);

export { router as physicalAssessmentRoutes };

