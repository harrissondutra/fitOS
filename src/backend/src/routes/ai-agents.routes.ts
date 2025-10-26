/**
 * AI Agents API Routes - FitOS Sprint 4
 * 
 * Rotas para interação com os agentes de IA de nutrição e CRM.
 */

import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { 
  aiNutritionAgent,
  crmAnalyticsAgent
} from '../agents';

const router = Router();

// ============================================================================
// NUTRITION AI AGENT ROUTES
// ============================================================================

/**
 * POST /api/ai/nutrition/analyze
 * Analisa dados nutricionais usando IA
 */
router.post('/nutrition/analyze', authenticateToken, validateRequest('nutritionAnalysis'), async (req, res) => {
  try {
    const analysisRequest = {
      ...req.body,
      clientId: req.body.clientId || req.user.id
    };

    const result = await aiNutritionAgent.analyzeNutrition(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in nutrition AI analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/nutrition/meal-plan
 * Gera plano alimentar personalizado
 */
router.post('/nutrition/meal-plan', authenticateToken, validateRequest('mealPlanGeneration'), async (req, res) => {
  try {
    const analysisRequest = {
      clientId: req.body.clientId || req.user.id,
      analysisType: 'meal_plan' as const,
      inputData: {
        age: req.body.age,
        gender: req.body.gender,
        height: req.body.height,
        weight: req.body.weight,
        activityLevel: req.body.activityLevel,
        goals: req.body.goals,
        dietaryRestrictions: req.body.dietaryRestrictions,
        allergies: req.body.allergies
      },
      preferences: req.body.preferences
    };

    const result = await aiNutritionAgent.analyzeNutrition(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/nutrition/diet-analysis
 * Analisa dieta atual do cliente
 */
router.post('/nutrition/diet-analysis', authenticateToken, validateRequest('dietAnalysis'), async (req, res) => {
  try {
    const analysisRequest = {
      clientId: req.body.clientId || req.user.id,
      analysisType: 'diet_analysis' as const,
      inputData: {
        foodDiary: req.body.foodDiary
      }
    };

    const result = await aiNutritionAgent.analyzeNutrition(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analyzing diet:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/nutrition/lab-interpretation
 * Interpreta resultados de exames laboratoriais
 */
router.post('/nutrition/lab-interpretation', authenticateToken, validateRequest('labInterpretation'), async (req, res) => {
  try {
    const analysisRequest = {
      clientId: req.body.clientId || req.user.id,
      analysisType: 'lab_interpretation' as const,
      inputData: {
        labResults: req.body.labResults
      }
    };

    const result = await aiNutritionAgent.analyzeNutrition(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error interpreting lab results:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/nutrition/supplement-recommendation
 * Recomenda suplementos baseado no perfil do cliente
 */
router.post('/nutrition/supplement-recommendation', authenticateToken, validateRequest('supplementRecommendation'), async (req, res) => {
  try {
    const analysisRequest = {
      clientId: req.body.clientId || req.user.id,
      analysisType: 'supplement_recommendation' as const,
      inputData: {
        currentSupplements: req.body.currentSupplements,
        medicalConditions: req.body.medicalConditions
      }
    };

    const result = await aiNutritionAgent.analyzeNutrition(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error recommending supplements:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// CRM ANALYTICS AI AGENT ROUTES
// ============================================================================

/**
 * POST /api/ai/crm/analyze
 * Analisa dados de CRM usando IA
 */
router.post('/crm/analyze', authenticateToken, validateRequest('crmAnalysis'), async (req, res) => {
  try {
    const analysisRequest = {
      ...req.body,
      tenantId: req.user.tenantId
    };

    const result = await crmAnalyticsAgent.analyzeCRM(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error in CRM AI analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/crm/sales-forecast
 * Gera previsão de vendas
 */
router.post('/crm/sales-forecast', authenticateToken, validateRequest('salesForecast'), async (req, res) => {
  try {
    const analysisRequest = {
      tenantId: req.user.tenantId,
      analysisType: 'sales_forecast' as const,
      inputData: {
        timeRange: req.body.timeRange,
        forecastPeriod: req.body.forecastPeriod
      },
      filters: req.body.filters
    };

    const result = await crmAnalyticsAgent.analyzeCRM(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error generating sales forecast:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/crm/pipeline-optimization
 * Otimiza pipeline de vendas
 */
router.post('/crm/pipeline-optimization', authenticateToken, validateRequest('pipelineOptimization'), async (req, res) => {
  try {
    const analysisRequest = {
      tenantId: req.user.tenantId,
      analysisType: 'pipeline_optimization' as const,
      inputData: {
        pipelineId: req.body.pipelineId
      }
    };

    const result = await crmAnalyticsAgent.analyzeCRM(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error optimizing pipeline:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/crm/churn-prediction
 * Prediz risco de churn de clientes
 */
router.post('/crm/churn-prediction', authenticateToken, validateRequest('churnPrediction'), async (req, res) => {
  try {
    const analysisRequest = {
      tenantId: req.user.tenantId,
      analysisType: 'churn_prediction' as const,
      inputData: {
        clientIds: req.body.clientIds
      }
    };

    const result = await crmAnalyticsAgent.analyzeCRM(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error predicting churn:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/crm/opportunity-scoring
 * Pontua oportunidades de vendas
 */
router.post('/crm/opportunity-scoring', authenticateToken, validateRequest('opportunityScoring'), async (req, res) => {
  try {
    const analysisRequest = {
      tenantId: req.user.tenantId,
      analysisType: 'opportunity_scoring' as const,
      inputData: {
        dealIds: req.body.dealIds
      }
    };

    const result = await crmAnalyticsAgent.analyzeCRM(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error scoring opportunities:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/ai/crm/performance-analysis
 * Analisa performance da equipe
 */
router.post('/crm/performance-analysis', authenticateToken, validateRequest('performanceAnalysis'), async (req, res) => {
  try {
    const analysisRequest = {
      tenantId: req.user.tenantId,
      analysisType: 'performance_analysis' as const,
      inputData: {
        userIds: req.body.userIds,
        metrics: req.body.metrics
      }
    };

    const result = await crmAnalyticsAgent.analyzeCRM(analysisRequest);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error analyzing performance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// AI AGENTS HEALTH CHECK ROUTES
// ============================================================================

/**
 * GET /api/ai/health
 * Health check dos agentes de IA
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const [
      nutritionHealth,
      crmHealth
    ] = await Promise.all([
      aiNutritionAgent.healthCheck(),
      crmAnalyticsAgent.healthCheck()
    ]);

    const health = {
      status: 'healthy',
      agents: {
        nutrition: nutritionHealth,
        crm: crmHealth
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking AI agents health:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/ai/nutrition/health
 * Health check do agente de nutrição
 */
router.get('/nutrition/health', authenticateToken, async (req, res) => {
  try {
    const health = await aiNutritionAgent.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking nutrition agent health:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/ai/crm/health
 * Health check do agente de CRM
 */
router.get('/crm/health', authenticateToken, async (req, res) => {
  try {
    const health = await crmAnalyticsAgent.healthCheck();
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking CRM agent health:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
