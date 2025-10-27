import { Router, Request, Response, NextFunction } from 'express';
import { OnlineAppointmentService } from '../services/online-appointment.service';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { body, validationResult } from 'express-validator';
import { errorHandler } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = Router();
const appointmentService = new OnlineAppointmentService();

// Validadores
const validateCreateAppointment = [
  body('professionalId').isString().notEmpty().withMessage('Professional ID is required'),
  body('professionalType').isString().notEmpty().withMessage('Professional type is required'),
  body('appointmentType').isString().notEmpty().withMessage('Appointment type is required'),
  body('scheduledAt').isISO8601().withMessage('Invalid scheduled date'),
  body('duration').optional().isInt({ min: 15, max: 240 }).withMessage('Duration must be between 15 and 240 minutes'),
  body('platform').isIn(['zoom', 'meet', 'teams']).withMessage('Invalid platform'),
  body('clientNotes').optional().isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

/**
 * POST /api/appointments/online
 * Criar agendamento online
 */
router.post(
  '/',
  authenticateToken,
  tenantMiddleware,
  validateCreateAppointment,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const userId = req.user?.id;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const appointment = await appointmentService.createAppointment(tenantId, {
        ...req.body,
        clientId: userId
      });

      res.status(201).json({
        success: true,
        data: appointment,
        message: 'Online appointment created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/appointments/online
 * Listar agendamentos
 */
router.get(
  '/',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const tenantId = req.tenantId;
      const { role = 'client', page, limit } = req.query;

      if (!userId || !tenantId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const appointments = await appointmentService.getUserAppointments(
        userId,
        tenantId,
        role as 'client' | 'professional',
        {
          page: page ? parseInt(page as string) : 1,
          limit: limit ? parseInt(limit as string) : 10
        }
      );

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/appointments/online/availability
 * Obter disponibilidade do profissional
 */
router.get(
  '/availability',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const { professionalId, startDate, endDate } = req.query;

      if (!tenantId || !professionalId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
      }

      const availability = await appointmentService.getProfessionalAvailability(
        professionalId as string,
        tenantId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: availability
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/appointments/online/:id/status
 * Atualizar status
 */
router.put(
  '/:id/status',
  authenticateToken,
  tenantMiddleware,
  body('status').isIn(['scheduled', 'in_progress', 'completed', 'cancelled', 'no_show']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const tenantId = req.tenantId;
      const { id } = req.params;
      const { status, notes } = req.body;

      const appointment = await appointmentService.updateAppointmentStatus(
        id,
        tenantId,
        status,
        notes
      );

      res.json({
        success: true,
        data: appointment,
        message: 'Appointment status updated'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/appointments/online/:id
 * Cancelar agendamento
 */
router.delete(
  '/:id',
  authenticateToken,
  tenantMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      await appointmentService.cancelAppointment(id, tenantId);

      res.json({
        success: true,
        message: 'Appointment cancelled successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

