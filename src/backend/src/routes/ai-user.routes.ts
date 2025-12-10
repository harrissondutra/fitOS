/**
 * AI User Routes - Rotas para uso de IA por usuários regulares
 * 
 * Acesso para: CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN
 * Respeita limites de plano e hierarquia de roles
 */

import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireAIAccess } from '../middleware/ai-access.middleware';
import { requireRole } from '../middleware/permissions';
import { getPrismaClient } from '../config/database';
import aiPredictionsRoutes from './ai-predictions-user.routes';
import aiGeneratorsRoutes from './ai-generators-user.routes';

const router = Router();

// Aplicar autenticação a todas as rotas (lazy para evitar criar PrismaClient antes de connectDatabase)
router.use((req, res, next) => {
  const prisma = getPrismaClient();
  const authMiddleware = getAuthMiddleware();
  authMiddleware.requireAuth()(req, res, next);
});

// Montar rotas específicas de usuário
router.use('/predictions', aiPredictionsRoutes);
router.use('/generators', aiGeneratorsRoutes);

export default router;

