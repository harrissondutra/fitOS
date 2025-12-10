import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TrainingProgramService } from '../services/training-program.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { body, param, query } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const programService = new TrainingProgramService(prisma);

// Extend Request interface
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    role: string;
  };
}

// POST /api/training-programs - Criar programa
router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  [
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('goal').notEmpty().withMessage('Goal is required'),
    body('duration').isInt().withMessage('Duration must be a number'),
    body('frequency').isInt().withMessage('Frequency must be a number'),
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required')
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const program = await programService.createProgram(
      { ...req.body, trainerId: req.user!.id },
      req.tenantId
    );

    res.status(201).json({
      success: true,
      data: { program }
    });
  })
);

// GET /api/training-programs - Listar programas
router.get(
  '/',
  authMiddleware,
  tenantMiddleware,
  [
    query('clientId').optional().isString(),
    query('trainerId').optional().isString()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { clientId, trainerId } = req.query;

    let programs;

    if (clientId) {
      programs = await programService.getClientPrograms(clientId as string, req.tenantId);
    } else if (trainerId) {
      programs = await programService.getTrainerPrograms(trainerId as string, req.tenantId);
    } else {
      programs = await programService.getTrainerPrograms(req.user!.id, req.tenantId);
    }

    res.json({
      success: true,
      data: { programs }
    });
  })
);

// GET /api/training-programs/:id - Buscar programa por ID
router.get(
  '/:id',
  authMiddleware,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    const program = await programService.getProgramById(id, req.tenantId);

    if (!program) {
      return res.status(404).json({
        success: false,
        error: 'Program not found'
      });
    }

    res.json({
      success: true,
      data: { program }
    });
  })
);

// PUT /api/training-programs/:id - Atualizar programa
router.put(
  '/:id',
  authMiddleware,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    const program = await programService.updateProgram(id, req.body, req.tenantId);

    res.json({
      success: true,
      data: { program }
    });
  })
);

// PUT /api/training-programs/:id/deactivate - Desativar programa
router.put(
  '/:id/deactivate',
  authMiddleware,
  tenantMiddleware,
  [param('id').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;

    const program = await programService.deactivateProgram(id, req.tenantId);

    res.json({
      success: true,
      data: { program }
    });
  })
);

// POST /api/training-programs/:id/generate-periodization - Gerar periodização
router.post(
  '/:id/generate-periodization',
  authMiddleware,
  tenantMiddleware,
  [
    param('id').isString().notEmpty(),
    body('goal').notEmpty().withMessage('Goal is required'),
    body('duration').isInt().withMessage('Duration must be a number')
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;
    const { goal, duration } = req.body;

    const phases = await programService.generatePeriodization(id, goal, duration);

    res.json({
      success: true,
      data: { phases }
    });
  })
);

export { router as trainingProgramRoutes };

