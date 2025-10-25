import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions';
import { asyncHandler } from '../utils/async-handler';
import BioimpedanceService from '../services/bioimpedance.service';

const router = express.Router();
const prisma = new PrismaClient();
const authMiddleware = new AuthMiddleware(prisma);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/bioimpedance
 * @desc Listar medições de bioimpedância
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    query('clientId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('search').optional().isString()
  ],
  asyncHandler(async (req: any, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { clientId, limit = 10, offset = 0, search } = req.query;
    const tenantId = req.user.tenantId;

    // Construir filtros
    const whereClause: any = {
      tenantId
    };

    if (clientId) {
      whereClause.clientId = clientId;
    }

    if (search) {
      whereClause.OR = [
        { client: { name: { contains: search, mode: 'insensitive' } } },
        { equipment: { contains: search, mode: 'insensitive' } },
        { operator: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Se for TRAINER, filtrar apenas clientes atribuídos
      if (req.user.role === 'TRAINER') {
      const assignedClients = await prisma.clientTrainer.findMany({
        where: { trainerId: req.user.id },
        select: { clientId: true }
      });
      
      whereClause.clientId = {
        in: assignedClients.map(ac => ac.clientId)
      };
    }

    const measurements = await prisma.bioimpedanceMeasurement.findMany({
      where: whereClause,
      orderBy: { measuredAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        professional: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.bioimpedanceMeasurement.count({
      where: whereClause
    });

    return res.json({
      success: true,
      data: {
        measurements,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  })
);

/**
 * @route GET /api/bioimpedance/:id
 * @desc Buscar medição específica
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/:id',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty()
  ],
  asyncHandler(async (req: any, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const result = await BioimpedanceService.getMeasurementById(id, tenantId);

      if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { message: result.error }
      });
    }

    return res.json({
      success: true,
      measurement: result.measurement
    });
  })
);

/**
 * @route POST /api/bioimpedance
 * @desc Criar nova medição de bioimpedância
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.post('/',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    body('clientId').isString().notEmpty().withMessage('Client ID is required'),
    body('height').isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm'),
    body('age').isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120 years'),
    body('gender').isIn(['male', 'female']).withMessage('Gender must be male or female'),
    body('weight').isFloat({ min: 10, max: 500 }).withMessage('Weight must be between 10 and 500 kg'),
    body('totalBodyWater').isFloat({ min: 0 }).withMessage('Total body water must be positive'),
    body('protein').isFloat({ min: 0 }).withMessage('Protein must be positive'),
    body('minerals').isFloat({ min: 0 }).withMessage('Minerals must be positive'),
    body('bodyFatMass').isFloat({ min: 0 }).withMessage('Body fat mass must be positive'),
    body('skeletalMuscleMass').isFloat({ min: 0 }).withMessage('Skeletal muscle mass must be positive'),
    body('bmi').isFloat({ min: 0 }).withMessage('BMI must be positive'),
    body('bodyFatPercentage').isFloat({ min: 0, max: 100 }).withMessage('Body fat percentage must be between 0 and 100'),
    body('fatFreeMass').isFloat({ min: 0 }).withMessage('Fat free mass must be positive'),
    body('basalMetabolicRate').isFloat({ min: 0 }).withMessage('Basal metabolic rate must be positive'),
    body('obesityDegree').isFloat({ min: 0 }).withMessage('Obesity degree must be positive'),
    body('skeletalMuscleIndex').isFloat({ min: 0 }).withMessage('Skeletal muscle index must be positive'),
    body('recommendedCalories').isFloat({ min: 0 }).withMessage('Recommended calories must be positive'),
    body('idealWeight').isFloat({ min: 0 }).withMessage('Ideal weight must be positive'),
    body('weightControl').isFloat().withMessage('Weight control must be a number'),
    body('fatControl').isFloat().withMessage('Fat control must be a number'),
    body('muscleControl').isFloat().withMessage('Muscle control must be a number'),
    body('leftArmMuscle').isFloat({ min: 0 }).withMessage('Left arm muscle must be positive'),
    body('rightArmMuscle').isFloat({ min: 0 }).withMessage('Right arm muscle must be positive'),
    body('trunkMuscle').isFloat({ min: 0 }).withMessage('Trunk muscle must be positive'),
    body('leftLegMuscle').isFloat({ min: 0 }).withMessage('Left leg muscle must be positive'),
    body('rightLegMuscle').isFloat({ min: 0 }).withMessage('Right leg muscle must be positive'),
    body('leftArmFat').isFloat({ min: 0 }).withMessage('Left arm fat must be positive'),
    body('rightArmFat').isFloat({ min: 0 }).withMessage('Right arm fat must be positive'),
    body('trunkFat').isFloat({ min: 0 }).withMessage('Trunk fat must be positive'),
    body('leftLegFat').isFloat({ min: 0 }).withMessage('Left leg fat must be positive'),
    body('rightLegFat').isFloat({ min: 0 }).withMessage('Right leg fat must be positive'),
    body('equipment').optional().isString(),
    body('operator').optional().isString(),
    body('notes').optional().isString(),
    body('qrCode').optional().isString(),
    body('waistHipRatio').optional().isFloat({ min: 0, max: 2 }),
    body('visceralFatLevel').optional().isInt({ min: 1, max: 59 }),
    body('impedance20kRightArm').optional().isFloat({ min: 0 }),
    body('impedance20kLeftArm').optional().isFloat({ min: 0 }),
    body('impedance20kTrunk').optional().isFloat({ min: 0 }),
    body('impedance20kRightLeg').optional().isFloat({ min: 0 }),
    body('impedance20kLeftLeg').optional().isFloat({ min: 0 }),
    body('impedance100kRightArm').optional().isFloat({ min: 0 }),
    body('impedance100kLeftArm').optional().isFloat({ min: 0 }),
    body('impedance100kTrunk').optional().isFloat({ min: 0 }),
    body('impedance100kRightLeg').optional().isFloat({ min: 0 }),
    body('impedance100kLeftLeg').optional().isFloat({ min: 0 })
  ],
  asyncHandler(async (req: any, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const tenantId = req.user.tenantId;
    const professionalId = req.user.id;

    // Verificar se o cliente existe e pertence ao tenant
    const client = await prisma.client.findFirst({
      where: {
        id: req.body.clientId,
        tenantId
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' }
      });
    }

    // Se for TRAINER, verificar se tem acesso ao cliente
    if (req.user.role === 'TRAINER') {
      const hasAccess = await prisma.clientTrainer.findFirst({
        where: {
          clientId: req.body.clientId,
          trainerId: professionalId,
          isActive: true
        }
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'You do not have access to this client' }
        });
      }
    }

    const measurementData = {
      tenantId,
      clientId: req.body.clientId,
      professionalId,
      measuredAt: new Date(),
      measurement: req.body
    };

    const result = await BioimpedanceService.createMeasurement(measurementData, professionalId);

      if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    return res.status(201).json({
      success: true,
      measurement: result.measurement
    });
  })
);

/**
 * @route GET /api/bioimpedance/:id/analysis
 * @desc Gerar análise completa da medição
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/:id/analysis',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty()
  ],
  asyncHandler(async (req: any, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const result = await BioimpedanceService.getMeasurementById(id, tenantId);

      if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { message: result.error }
      });
    }

    const analysis = await BioimpedanceService.generateAnalysis(result.measurement);

    return res.json({
      success: true,
      analysis
    });
  })
);

/**
 * @route GET /api/bioimpedance/:id/exercise-estimates
 * @desc Gerar estimativas de calorias para exercícios
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/:id/exercise-estimates',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('id').isString().notEmpty()
  ],
  asyncHandler(async (req: any, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const result = await BioimpedanceService.getMeasurementById(id, tenantId);

      if (!result.success) {
      return res.status(404).json({
        success: false,
        error: { message: result.error }
      });
    }

    const estimates = BioimpedanceService.generateExerciseCalorieEstimates(result.measurement.weight);

    return res.json({
      success: true,
      estimates
    });
  })
);

/**
 * @route GET /api/bioimpedance/client/:clientId
 * @desc Listar medições de um cliente específico
 * @access TRAINER, ADMIN, OWNER, SUPER_ADMIN
 */
router.get('/client/:clientId',
  requireRole(['TRAINER', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [
    param('clientId').isString().notEmpty(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  asyncHandler(async (req: any, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { clientId } = req.params;
    const { limit = 10, offset = 0 } = req.query;
    const tenantId = req.user.tenantId;

    // Verificar se o cliente existe e pertence ao tenant
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        tenantId
      }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' }
      });
    }

    // Se for TRAINER, verificar se tem acesso ao cliente
    if (req.user.role === 'TRAINER') {
      const hasAccess = await prisma.clientTrainer.findFirst({
        where: {
          clientId,
          trainerId: req.user.id,
          isActive: true
        }
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { message: 'You do not have access to this client' }
        });
      }
    }

    const result = await BioimpedanceService.getClientMeasurements(
      clientId,
      tenantId,
      parseInt(limit),
      parseInt(offset)
      );

      if (!result.success) {
      return res.status(400).json({
        success: false,
        error: { message: result.error }
      });
    }

    return res.json({
      success: true,
      data: {
        measurements: result.measurements,
        pagination: {
          total: result.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          pages: Math.ceil((result.total || 0) / parseInt(limit))
        }
      }
    });
  })
);

export default router;