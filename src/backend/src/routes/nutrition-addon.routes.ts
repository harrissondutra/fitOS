/**
 * Nutrition Addon Routes - Sprint 7
 * Rotas para gestão de assinaturas e compra de add-ons
 */

import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions';
import { asyncHandler } from '../utils/async-handler';
import nutritionAddonService, { NutritionAddonService } from '../services/nutrition-addon.service';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/nutrition-addon/plans
 * @desc Listar planos de add-on disponíveis
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = nutritionAddonService.listPlans();
    res.json({ success: true, data: plans });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route GET /api/nutrition-addon/my-subscription
 * @desc Obter assinatura ativa do usuário
 */
router.get('/my-subscription',
  requireRole(['NUTRITIONIST', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const subscription = await nutritionAddonService.getActiveSubscription(
        req.tenantId,
        req.user.id
      );

      res.json({ success: true, data: subscription });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route POST /api/nutrition-addon/checkout
 * @desc Criar checkout para assinatura
 */
router.post('/checkout',
  requireRole(['NUTRITIONIST', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  [body('planId').isString().notEmpty()],
  async (req: any, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Invalid plan ID' });
    }

    try {
      const { planId } = req.body;
      
      // TODO: Integrar com Stripe/Mercado Pago para criar checkout
      // Por enquanto, apenas criar assinatura direta (para testes)
      
      const checkoutUrl = `/payment?plan=${planId}&tenantId=${req.tenantId}&userId=${req.user.id}`;
      
      res.json({ success: true, checkoutUrl });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route POST /api/nutrition-addon/trial
 * @desc Criar trial gratuito de 7 dias
 */
router.post('/trial',
  requireRole(['NUTRITIONIST', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      const trial = await nutritionAddonService.createTrial(
        req.tenantId,
        req.user.id
      );

      res.json({ success: true, data: trial, message: 'Trial ativado com sucesso!' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
);

/**
 * @route DELETE /api/nutrition-addon/cancel
 * @desc Cancelar assinatura
 */
router.delete('/cancel/:subscriptionId',
  requireRole(['NUTRITIONIST', 'ADMIN', 'OWNER', 'SUPER_ADMIN']),
  async (req: any, res) => {
    try {
      await nutritionAddonService.cancelSubscription(req.params.subscriptionId);
      
      res.json({ success: true, message: 'Assinatura cancelada com sucesso' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;

