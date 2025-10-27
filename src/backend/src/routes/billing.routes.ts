/**
 * Billing API Routes
 * 
 * Rotas protegidas para gestão de billing:
 * - GET /api/billing/subscription - Ver assinatura atual
 * - GET /api/billing/invoices - Histórico de faturas
 * - GET /api/billing/payment-methods - Métodos de pagamento
 * - POST /api/billing/upgrade - Upgrade de plano
 * - POST /api/billing/downgrade - Downgrade de plano
 * - POST /api/billing/cancel - Cancelar assinatura
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { BillingService } from '../services/billing.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const billingService = new BillingService(prisma);

// Schemas de validação
const upgradeSchema = z.object({
  newPlanId: z.string().min(1, 'Plano é obrigatório'),
  billingCycle: z.enum(['monthly', 'yearly']).optional()
});

const downgradeSchema = z.object({
  newPlanId: z.string().min(1, 'Plano é obrigatório')
});

const cancelSchema = z.object({
  reason: z.string().min(1, 'Motivo é obrigatório'),
  feedback: z.string().optional()
});

/**
 * GET /api/billing/subscription
 * Obter assinatura atual do tenant
 */
router.get('/subscription',
  authenticateToken,
  tenantMiddleware,
  async (req, res, next) => {
    try {
      const { tenantId } = req;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const subscription = await billingService.getSubscription(tenantId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      logger.error('Error fetching subscription:', error);
      next(error);
    }
  }
);

/**
 * GET /api/billing/invoices
 * Histórico de faturas com paginação
 */
router.get('/invoices',
  authenticateToken,
  tenantMiddleware,
  async (req, res, next) => {
    try {
      const { tenantId } = req;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const invoices = await billingService.getInvoices(tenantId, {
        page,
        limit
      });

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      next(error);
    }
  }
);

/**
 * GET /api/billing/payment-methods
 * Métodos de pagamento salvos
 */
router.get('/payment-methods',
  authenticateToken,
  tenantMiddleware,
  async (req, res, next) => {
    try {
      const { tenantId } = req;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const paymentMethods = await billingService.getPaymentMethods(tenantId);

      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error) {
      logger.error('Error fetching payment methods:', error);
      next(error);
    }
  }
);

/**
 * POST /api/billing/upgrade
 * Upgrade de plano com cálculo de prorata
 */
router.post('/upgrade',
  authenticateToken,
  tenantMiddleware,
  async (req, res, next) => {
    try {
      const { tenantId } = req;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const validated = upgradeSchema.parse(req.body);

      const result = await billingService.upgradePlan(
        tenantId,
        validated.newPlanId,
        validated.billingCycle,
        userId || ''
      );

      logger.info('Subscription upgraded', {
        tenantId,
        newPlanId: validated.newPlanId,
        userId
      });

      res.json({
        success: true,
        data: result,
        message: 'Plano atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Error upgrading subscription:', error);
      next(error);
    }
  }
);

/**
 * POST /api/billing/downgrade
 * Downgrade de plano
 */
router.post('/downgrade',
  authenticateToken,
  tenantMiddleware,
  async (req, res, next) => {
    try {
      const { tenantId } = req;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const validated = downgradeSchema.parse(req.body);

      const result = await billingService.downgradePlan(
        tenantId,
        validated.newPlanId,
        userId || ''
      );

      logger.info('Subscription downgraded', {
        tenantId,
        newPlanId: validated.newPlanId,
        userId
      });

      res.json({
        success: true,
        data: result,
        message: 'Plano atualizado. Mudança será aplicada no próximo ciclo'
      });
    } catch (error) {
      logger.error('Error downgrading subscription:', error);
      next(error);
    }
  }
);

/**
 * POST /api/billing/cancel
 * Cancelar assinatura com retenção
 */
router.post('/cancel',
  authenticateToken,
  tenantMiddleware,
  async (req, res, next) => {
    try {
      const { tenantId } = req;
      const userId = req.user?.id;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      const validated = cancelSchema.parse(req.body);

      const result = await billingService.cancelSubscription(
        tenantId,
        validated.reason,
        validated.feedback,
        userId || ''
      );

      logger.info('Subscription cancelled', {
        tenantId,
        reason: validated.reason,
        userId
      });

      res.json({
        success: true,
        data: result,
        message: 'Assinatura cancelada. Acesso até fim do período atual'
      });
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      next(error);
    }
  }
);

export default router;

