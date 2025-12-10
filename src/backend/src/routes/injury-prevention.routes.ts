/**
 * Injury Prevention Routes - Sprint 7
 * Rotas para análise de prevenção de lesões
 */

import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { getPrismaClient } from '../config/database';
import injuryPreventionAgent from '../agents/injury-prevention-agent';
import { requireNutritionAddon } from '../middleware/nutrition-addon-check';

const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();
const router = Router();

/**
 * POST /api/injury-prevention/analyze
 * Analisar risco de lesões
 */
router.post('/analyze',
  authMiddleware.authenticateToken,
  requireNutritionAddon('aiInjuryPrevention'),
  async (req, res) => {
    try {
      const { workoutHistory, currentSymptoms, demographics, currentProgram } = req.body;
      
      const analysis = await injuryPreventionAgent.analyzeInjuryRisk({
        workoutHistory,
        currentSymptoms,
        demographics,
        currentProgram
      });
      
      // Gerar alertas
      const alerts = await injuryPreventionAgent.generatePreventiveAlerts(analysis, {
        low: 0.2,
        medium: 0.5,
        high: 0.8
      });
      
      res.json({
        success: true,
        data: {
          analysis,
          alerts
        }
      });
    } catch (error) {
      console.error('Error analyzing injury risk:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
);

export default router;




