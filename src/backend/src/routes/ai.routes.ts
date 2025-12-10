/**
 * AI Routes - Router central para todas as rotas de IA
 * 
 * Organiza as rotas de IA em um único ponto de entrada
 */

import { Router } from 'express';
import { getPrismaClient } from '../config/database';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireSuperAdmin } from '../middleware/superAdmin';
import aiDashboardRoutes from './ai-dashboard';
import aiLimitsRoutes from './ai-limits';
import aiIntegrationsRoutes from './ai-integrations';
import aiSettingsRoutes from './ai-settings';
import aiProvidersRoutes from './ai-providers';
import aiServiceConfigsRoutes from './ai-service-configs';
import aiTemplatesRoutes from './ai-templates';
import aiPredictionsRoutes from './ai-predictions.routes';
import aiGeneratorsRoutes from './ai-generators.routes';
import aiProvidersHelpRoutes from './ai-providers-help.routes';
import aiLogsRoutes from './ai-logs';

const router = Router();

// Aplicar middleware de autenticação ANTES de requireSuperAdmin (lazy evaluation)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  // Desabilitar verificação de sessão para SUPER_ADMIN evitar deslogar
  authMiddleware.requireAuth({ checkSessionActivity: false })(req, res, next);
});

// Aplicar middleware de super admin para todas as rotas (depende de req.user do requireAuth)
router.use(requireSuperAdmin);

// Montar todas as rotas de IA
// IMPORTANTE: Rotas mais específicas devem vir ANTES das genéricas
router.use('/dashboard', aiDashboardRoutes);
router.use('/limits', aiLimitsRoutes);
router.use('/integrations', aiIntegrationsRoutes);
router.use('/settings', aiSettingsRoutes);
router.use('/logs', aiLogsRoutes);
router.use('/providers/help', aiProvidersHelpRoutes);
router.use('/providers', aiProvidersRoutes);
router.use('/service-configs', aiServiceConfigsRoutes);
router.use('/templates', aiTemplatesRoutes);
router.use('/predictions', aiPredictionsRoutes);
router.use('/generators', aiGeneratorsRoutes);

export default router;

