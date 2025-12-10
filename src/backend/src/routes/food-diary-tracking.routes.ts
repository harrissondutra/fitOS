/**
 * Food Diary Tracking Routes - FitOS Sprint 7
 * 
 * Rotas para tracking alimentar de clientes com permissões hierárquicas
 * CLIENT: pode gerenciar próprio diário
 * NUTRITIONIST: pode visualizar diário de clientes
 * ADMIN/OWNER/SUPER_ADMIN: acesso total
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { foodDiaryTrackingService } from '../services/nutrition/food-diary-tracking.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { logger } from '../utils/logger';

const router = Router();
const prisma = new PrismaClient();
const authMiddleware = getAuthMiddleware(prisma);

/**
 * POST /api/nutrition/tracking/entries
 * Adiciona alimento ao diário alimentar
 * Permissão: CLIENT (próprio diário)
 */
router.post('/entries',
  authMiddleware.requireRole(['CLIENT']),
  async (req, res) => {
    try {
      const entry = await foodDiaryTrackingService.addFoodEntry({
        ...req.body,
        clientId: req.user!.id,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({
        success: true,
        data: entry,
        message: 'Alimento adicionado ao diário com sucesso'
      });
    } catch (error: any) {
      logger.error('Error adding food entry:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao adicionar alimento'
      });
    }
  }
);

/**
 * GET /api/nutrition/tracking/daily/:date
 * Busca totais diários com metas e aderência
 * Permissão: CLIENT (próprio) ou NUTRITIONIST (clientes)
 */
router.get('/daily/:date',
  authMiddleware.requireRole(['CLIENT', 'NUTRITIONIST']),
  async (req, res) => {
    try {
      const clientId = (req.query.clientId as string) || req.user!.id;
      
      // CLIENT só pode ver próprio diário, NUTRITIONIST pode ver de clientes
      if (req.user!.role === 'CLIENT' && clientId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      const totals = await foodDiaryTrackingService.getDailyTotalsWithGoals(
        clientId,
        new Date(req.params.date)
      );

      res.json({
        success: true,
        data: totals
      });
    } catch (error: any) {
      logger.error('Error getting daily totals:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao buscar totais diários'
      });
    }
  }
);

/**
 * GET /api/nutrition/tracking/history
 * Busca histórico de tracking (últimos 30 dias)
 * Permissão: CLIENT (próprio) ou NUTRITIONIST (clientes)
 */
router.get('/history',
  authMiddleware.requireRole(['CLIENT', 'NUTRITIONIST']),
  async (req, res) => {
    try {
      const clientId = (req.query.clientId as string) || req.user!.id;
      const days = parseInt(req.query.days as string) || 30;
      
      // CLIENT só pode ver próprio histórico
      if (req.user!.role === 'CLIENT' && clientId !== req.user!.id) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
      }

      const history = await foodDiaryTrackingService.getTrackingHistory(clientId, days);

      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      logger.error('Error getting tracking history:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao buscar histórico'
      });
    }
  }
);

/**
 * DELETE /api/nutrition/tracking/entries/:id
 * Remove alimento do diário
 * Permissão: CLIENT (próprio diário)
 */
router.delete('/entries/:id',
  authMiddleware.requireRole(['CLIENT']),
  async (req, res) => {
    try {
      await foodDiaryTrackingService.deleteEntry(req.params.id, req.user!.id);

      res.json({
        success: true,
        message: 'Alimento removido do diário'
      });
    } catch (error: any) {
      logger.error('Error deleting food entry:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Erro ao remover alimento'
      });
    }
  }
);

/**
 * GET /api/nutrition/tracking/health
 * Health check do serviço de tracking
 * Permissão: Público
 */
router.get('/health', async (req, res) => {
  try {
    const health = await foodDiaryTrackingService.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;

