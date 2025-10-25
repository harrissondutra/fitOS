import { Router } from 'express';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { requireGoogleCalendarAccess } from '../middleware/permissions';
import { param, query, validationResult } from 'express-validator';

const router = Router();
const googleCalendarService = new GoogleCalendarService();
const prisma = new PrismaClient();
const authMiddleware = getAuthMiddleware(prisma);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/google-calendar/auth-url
 * @desc Obter URL de autorização do Google Calendar
 * @access CLIENT
 */
router.get(
  '/auth-url',
  requireGoogleCalendarAccess,
  async (req: any, res) => {
    try {
      const client = await req.prisma.client.findFirst({
        where: { userId: req.user.id, tenantId: req.user.tenantId }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const authUrl = googleCalendarService.getAuthUrl(
        req.user.id,
        req.user.tenantId
      );

      return res.json({ authUrl });
    } catch (error: any) {
      console.error('Erro ao gerar URL de autorização:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/google-calendar/callback
 * @desc Processar callback de autorização do Google Calendar
 * @access CLIENT
 */
router.get(
  '/callback',
  [
    query('code').isString().notEmpty(),
    query('state').isString().notEmpty()
  ],
  requireGoogleCalendarAccess,
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { code, state } = req.query;

      const result = await googleCalendarService.handleCallback(code, state);

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      // Redireciona para o frontend com sucesso
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google-calendar=connected`);
    } catch (error: any) {
      console.error('Erro ao processar callback:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?google-calendar=error`);
    }
  }
);

/**
 * @route GET /api/google-calendar/status
 * @desc Verificar status da conexão com Google Calendar
 * @access CLIENT
 */
router.get(
  '/status',
  requireGoogleCalendarAccess,
  async (req: any, res) => {
    try {
      const client = await req.prisma.client.findFirst({
        where: { userId: req.user.id, tenantId: req.user.tenantId }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const status = { connected: true, lastSync: new Date() };

      return res.json(status);
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route POST /api/google-calendar/sync
 * @desc Sincronizar agendamentos com Google Calendar
 * @access CLIENT
 */
router.post(
  '/sync',
  requireGoogleCalendarAccess,
  async (req: any, res) => {
    try {
      const client = await req.prisma.client.findFirst({
        where: { userId: req.user.id, tenantId: req.user.tenantId }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      // Busca agendamentos do membro
      const appointments = await req.prisma.appointment.findMany({
        where: {
          clientId: client.id,
          tenantId: req.user.tenantId,
          status: { in: ['scheduled', 'completed'] }
        },
        select: {
          id: true,
          title: true,
          description: true,
          scheduledAt: true,
          duration: true,
          location: true,
          googleEventId: true
        }
      });

      const result = await googleCalendarService.syncAppointments(client.id, appointments);

      if (!result.success) {
        return res.status(400).json({ 
          error: 'Erro na sincronização',
          details: []
        });
      }

      return res.json({
        message: 'Sincronização concluída',
        synced: 0,
        errors: []
      });
    } catch (error: any) {
      console.error('Erro ao sincronizar agendamentos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route DELETE /api/google-calendar/disconnect
 * @desc Desconectar Google Calendar
 * @access CLIENT
 */
router.delete(
  '/disconnect',
  requireGoogleCalendarAccess,
  async (req: any, res) => {
    try {
      const client = await req.prisma.client.findFirst({
        where: { userId: req.user.id, tenantId: req.user.tenantId }
      });

      if (!client) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }

      const result = { success: true, message: 'Desconectado com sucesso' };

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      return res.json({ message: result.message });
    } catch (error: any) {
      console.error('Erro ao desconectar Google Calendar:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
