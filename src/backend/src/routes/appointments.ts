import { Router } from 'express';
import { SchedulingService } from '../services/scheduling.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import { requireRole, requireResourceAccess, canCreateForClient } from '../middleware/permissions';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();
const schedulingService = new SchedulingService();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route POST /api/appointments
 * @desc Criar novo agendamento
 * @access OWNER, ADMIN, TRAINER
 */
router.post(
  '/',
  [
    body('professionalId').isString().notEmpty(),
    body('clientId').isString().notEmpty(),
    body('type').isIn(['consultation', 'training', 'nutrition', 'bioimpedance']),
    body('title').isString().notEmpty(),
    body('scheduledAt').isISO8601(),
    body('duration').isInt({ min: 15, max: 480 }),
    body('description').optional().isString(),
    body('location').optional().isString(),
    body('isVirtual').optional().isBoolean(),
    body('notes').optional().isString()
  ],
  requireRole(['OWNER', 'ADMIN', 'TRAINER']),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { clientId, ...appointmentData } = req.body;
      const userId = req.user.id;
      const tenantId = req.user.tenantId;

      // Verifica se pode criar agendamento para este membro
      const canCreate = await canCreateForClient(
        userId,
        clientId,
        req.user.role,
        tenantId
      );

      if (!canCreate) {
        return res.status(403).json({
          error: 'Você não tem permissão para criar agendamentos para este membro'
        });
      }

      const result = await schedulingService.createAppointment(
        {
          ...appointmentData,
          tenantId,
          professionalId: req.body.professionalId,
          clientId
        },
        userId
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        message: 'Agendamento criado com sucesso',
        appointment: result.appointment
      });
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointments
 * @desc Listar agendamentos
 * @access OWNER, ADMIN, TRAINER, CLIENT
 */
router.get(
  '/',
  [
    query('professionalId').optional().isString(),
    query('clientId').optional().isString(),
    query('status').optional().isString(),
    query('type').optional().isString(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        tenantId: req.user.tenantId,
        ...req.query
      };

      // Ajusta filtros baseado na role
      if (req.user.role === 'TRAINER') {
        filters.professionalId = req.user.id;
      } else if (req.user.role === 'CLIENT') {
        // Para membros, busca apenas seus próprios agendamentos
        const client = await req.prisma.client.findFirst({
          where: { userId: req.user.id, tenantId: req.user.tenantId }
        });
        if (client) {
          filters.clientId = client.id;
        } else {
          return res.status(404).json({ error: 'Membro não encontrado' });
        }
      }

      const result = await schedulingService.getAppointments(filters);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        appointments: result.appointments,
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      });
    } catch (error: any) {
      console.error('Erro ao listar agendamentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointments/:id
 * @desc Obter agendamento por ID
 * @access OWNER, ADMIN, TRAINER, CLIENT
 */
router.get(
  '/:id',
  [param('id').isString().notEmpty()],
  requireResourceAccess('appointment'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await schedulingService.getAppointmentById(req.params.id);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ appointment: result.appointment });
    } catch (error: any) {
      console.error('Erro ao obter agendamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/appointments/:id
 * @desc Atualizar agendamento
 * @access OWNER, ADMIN, TRAINER
 */
router.put(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('scheduledAt').optional().isISO8601(),
    body('duration').optional().isInt({ min: 15, max: 480 }),
    body('location').optional().isString(),
    body('isVirtual').optional().isBoolean(),
    body('status').optional().isIn(['scheduled', 'completed', 'cancelled', 'no_show']),
    body('notes').optional().isString(),
    body('cancellationReason').optional().isString()
  ],
  requireRole(['OWNER', 'ADMIN', 'TRAINER']),
  requireResourceAccess('appointment'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await schedulingService.updateAppointment(
        req.params.id,
        req.body,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        message: 'Agendamento atualizado com sucesso',
        appointment: result.appointment
      });
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/appointments/:id
 * @desc Cancelar agendamento
 * @access OWNER, ADMIN, TRAINER
 */
router.delete(
  '/:id',
  [
    param('id').isString().notEmpty(),
    body('reason').isString().notEmpty()
  ],
  requireRole(['OWNER', 'ADMIN', 'TRAINER']),
  requireResourceAccess('appointment'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await schedulingService.cancelAppointment(
        req.params.id,
        req.body.reason,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ message: 'Agendamento cancelado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointments/availability/:professionalId
 * @desc Obter horários disponíveis para um profissional
 * @access OWNER, ADMIN, TRAINER, CLIENT
 */
router.get(
  '/availability/:professionalId',
  [
    param('professionalId').isString().notEmpty(),
    query('date').isISO8601(),
    query('duration').optional().isInt({ min: 15, max: 480 })
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { professionalId } = req.params;
      const date = new Date(req.query.date);
      const duration = parseInt(req.query.duration) || 60;

      const slots = await schedulingService.getAvailableSlots(
        req.user.tenantId,
        professionalId,
        date,
        duration
      );

      res.json({ slots });
    } catch (error: any) {
      console.error('Erro ao obter horários disponíveis:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/appointments/stats
 * @desc Obter estatísticas de agendamentos
 * @access OWNER, ADMIN, TRAINER
 */
router.get(
  '/stats',
  [
    query('professionalId').optional().isString()
  ],
  requireRole(['OWNER', 'ADMIN', 'TRAINER']),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const professionalId = req.user.role === 'TRAINER' ? req.user.id : req.query.professionalId;

      const result = await schedulingService.getAppointmentStats(
        req.user.tenantId,
        professionalId
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ stats: result.stats });
    } catch (error: any) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
