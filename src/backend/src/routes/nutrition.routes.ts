/**
 * Nutrition API Routes - FitOS Sprint 4
 * 
 * Rotas completas para o módulo nutricional com autenticação JWT e validação.
 */

import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const authMiddleware = getAuthMiddleware(prisma);
import { 
  foodDatabaseService,
  mealPlanService,
  recipeService,
  foodDiaryService,
  nutritionProfessionalService,
  nutritionClientService,
  nutritionConsultationService,
  nutritionGoalService,
  laboratoryExamService,
  supplementPrescriptionService
} from '../services/nutrition';

const router = Router();

// ============================================================================
// FOOD DATABASE ROUTES
// ============================================================================

/**
 * GET /api/nutrition/foods/search
 * Busca alimentos na base de dados TACO
 */
router.get('/foods/search', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { query, category, limit = 20, offset = 0 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await foodDatabaseService.searchFoods({
      name: query as string,
      category: category as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: results,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: results.length
      }
    });
  } catch (error) {
    console.error('Error searching foods:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/foods/:id
 * Busca alimento específico por ID
 */
router.get('/foods/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const food = await foodDatabaseService.getFoodById(id);
    
    if (!food) {
      return res.status(404).json({ 
        success: false, 
        error: 'Food not found' 
      });
    }

    res.json({
      success: true,
      data: food
    });
  } catch (error) {
    console.error('Error getting food:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/foods/categories
 * Lista todas as categorias de alimentos
 */
router.get('/foods/categories', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const categories = await foodDatabaseService.getFoodCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting food categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// MEAL PLAN ROUTES
// ============================================================================

/**
 * POST /api/nutrition/meal-plans
 * Cria novo plano alimentar
 */
router.post('/meal-plans', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const mealPlanData = {
      ...req.body,
      tenantId: req.user.tenantId,
      nutritionistId: req.user.id
    };

    const mealPlan = await mealPlanService.createMealPlan(mealPlanData);
    
    res.status(201).json({
      success: true,
      data: mealPlan
    });
  } catch (error) {
    console.error('Error creating meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/meal-plans
 * Lista planos alimentares
 */
router.get('/meal-plans', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { clientId, isActive, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      clientId: clientId as string,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const mealPlans = await mealPlanService.getMealPlans(filters);
    
    res.json({
      success: true,
      data: mealPlans
    });
  } catch (error) {
    console.error('Error getting meal plans:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/meal-plans/:id
 * Busca plano alimentar específico
 */
router.get('/meal-plans/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const mealPlan = await mealPlanService.getMealPlanById(id);
    
    if (!mealPlan) {
      return res.status(404).json({ 
        success: false, 
        error: 'Meal plan not found' 
      });
    }

    res.json({
      success: true,
      data: mealPlan
    });
  } catch (error) {
    console.error('Error getting meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/meal-plans/:id
 * Atualiza plano alimentar
 */
router.put('/meal-plans/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const mealPlan = await mealPlanService.updateMealPlan({ id, ...req.body });
    
    res.json({
      success: true,
      data: mealPlan
    });
  } catch (error) {
    console.error('Error updating meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/nutrition/meal-plans/:id
 * Remove plano alimentar
 */
router.delete('/meal-plans/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await mealPlanService.deleteMealPlan(id);
    
    res.json({
      success: true,
      message: 'Meal plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// RECIPE ROUTES
// ============================================================================

/**
 * POST /api/nutrition/recipes
 * Cria nova receita
 */
router.post('/recipes', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const recipeData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id
    };

    const recipe = await recipeService.createRecipe(recipeData);
    
    res.status(201).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/recipes
 * Lista receitas
 */
router.get('/recipes', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { category, difficulty, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      category: category as string,
      difficulty: difficulty as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const recipes = await recipeService.getAllRecipes(req.user.tenantId);
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    console.error('Error getting recipes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/recipes/:id
 * Busca receita específica
 */
router.get('/recipes/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.getRecipeById(id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false, 
        error: 'Recipe not found' 
      });
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error getting recipe:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/recipes/:id
 * Atualiza receita
 */
router.put('/recipes/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await recipeService.updateRecipe({ id, ...req.body });
    
    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/nutrition/recipes/:id
 * Remove receita
 */
router.delete('/recipes/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await recipeService.deleteRecipe(id);
    
    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// FOOD DIARY ROUTES
// ============================================================================

/**
 * POST /api/nutrition/food-diary
 * Adiciona entrada no diário alimentar
 */
router.post('/food-diary', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const diaryData = {
      ...req.body,
      tenantId: req.user.tenantId,
      clientId: req.user.id // Assumindo que o usuário é o cliente
    };

    const entry = await foodDiaryService.createFoodDiaryEntry(diaryData);
    
    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error creating food diary entry:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/food-diary
 * Lista entradas do diário alimentar
 */
router.get('/food-diary', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { clientId, date, mealType, limit = 50, offset = 0 } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      clientId: (clientId as string) || req.user.id,
      date: date ? new Date(date as string) : undefined,
      mealType: mealType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const entries = await foodDiaryService.getFoodDiaryEntries(filters);
    
    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error('Error getting food diary entries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/food-diary/:id
 * Atualiza entrada do diário alimentar
 */
router.put('/food-diary/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await foodDiaryService.updateFoodDiaryEntry({ id, ...req.body });
    
    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error updating food diary entry:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/nutrition/food-diary/:id
 * Remove entrada do diário alimentar
 */
router.delete('/food-diary/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await foodDiaryService.deleteFoodDiaryEntry(id);
    
    res.json({
      success: true,
      message: 'Food diary entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food diary entry:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// NUTRITION PROFESSIONAL ROUTES
// ============================================================================

/**
 * POST /api/nutrition/professionals
 * Cria perfil profissional de nutrição
 */
router.post('/professionals', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const profileData = {
      ...req.body,
      tenantId: req.user.tenantId,
      userId: req.user.id
    };

    const profile = await nutritionProfessionalService.createProfessionalProfile(profileData);
    
    res.status(201).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error creating nutrition professional profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/professionals/:id
 * Busca perfil profissional específico
 */
router.get('/professionals/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await nutritionProfessionalService.getProfessionalProfileById(id);
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Professional profile not found' 
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting nutrition professional profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/professionals/user/:userId
 * Busca perfil profissional por usuário
 */
router.get('/professionals/user/:userId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await nutritionProfessionalService.getProfessionalProfileByUserId(userId);
    
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Professional profile not found' 
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting nutrition professional profile by user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/professionals/:id
 * Atualiza perfil profissional
 */
router.put('/professionals/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await nutritionProfessionalService.updateProfessionalProfile({ id, ...req.body });
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error updating nutrition professional profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// NUTRITION CLIENT ROUTES
// ============================================================================

/**
 * POST /api/nutrition/clients
 * Cria perfil de cliente nutricional
 */
router.post('/clients', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const clientData = {
      ...req.body,
      tenantId: req.user.tenantId,
      userId: req.user.id
    };

    const client = await nutritionClientService.createNutritionClient(clientData);
    
    res.status(201).json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error creating nutrition client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/clients/:id
 * Busca cliente nutricional específico
 */
router.get('/clients/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await nutritionClientService.getNutritionClientById(id);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nutrition client not found' 
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error getting nutrition client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/clients/user/:userId
 * Busca cliente nutricional por usuário
 */
router.get('/clients/user/:userId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const client = await nutritionClientService.getNutritionClientByUserId(userId);
    
    if (!client) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nutrition client not found' 
      });
    }

    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error getting nutrition client by user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/clients/:id
 * Atualiza cliente nutricional
 */
router.put('/clients/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const client = await nutritionClientService.updateNutritionClient({ id, ...req.body });
    
    res.json({
      success: true,
      data: client
    });
  } catch (error) {
    console.error('Error updating nutrition client:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// NUTRITION CONSULTATION ROUTES
// ============================================================================

/**
 * POST /api/nutrition/consultations
 * Cria nova consulta nutricional
 */
router.post('/consultations', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const consultationData = {
      ...req.body,
      tenantId: req.user.tenantId,
      nutritionistId: req.user.id
    };

    const consultation = await nutritionConsultationService.createConsultation(consultationData);
    
    res.status(201).json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Error creating nutrition consultation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/consultations
 * Lista consultas nutricionais
 */
router.get('/consultations', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { clientId, nutritionistId, status, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      clientId: clientId as string,
      nutritionistId: nutritionistId as string,
      status: status as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const consultations = await nutritionConsultationService.getConsultations(filters);
    
    res.json({
      success: true,
      data: consultations
    });
  } catch (error) {
    console.error('Error getting nutrition consultations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/consultations/:id
 * Busca consulta nutricional específica
 */
router.get('/consultations/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await nutritionConsultationService.getConsultationById(id);
    
    if (!consultation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nutrition consultation not found' 
      });
    }

    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Error getting nutrition consultation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/consultations/:id
 * Atualiza consulta nutricional
 */
router.put('/consultations/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await nutritionConsultationService.updateConsultation({ id, ...req.body });
    
    res.json({
      success: true,
      data: consultation
    });
  } catch (error) {
    console.error('Error updating nutrition consultation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// NUTRITION GOAL ROUTES
// ============================================================================

/**
 * POST /api/nutrition/goals
 * Cria nova meta nutricional
 */
router.post('/goals', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const goalData = {
      ...req.body,
      tenantId: req.user.tenantId,
      clientId: req.user.id
    };

    const goal = await nutritionGoalService.createNutritionGoal(goalData);
    
    res.status(201).json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error creating nutrition goal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/goals
 * Lista metas nutricionais
 */
router.get('/goals', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { clientId, status, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      tenantId: req.user.tenantId,
      clientId: (clientId as string) || req.user.id,
      status: status as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const goals = await nutritionGoalService.getNutritionGoals(filters);
    
    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error getting nutrition goals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/goals/:id
 * Busca meta nutricional específica
 */
router.get('/goals/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await nutritionGoalService.getNutritionGoalById(id);
    
    if (!goal) {
      return res.status(404).json({ 
        success: false, 
        error: 'Nutrition goal not found' 
      });
    }

    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error getting nutrition goal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/goals/:id
 * Atualiza meta nutricional
 */
router.put('/goals/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const goal = await nutritionGoalService.updateNutritionGoal({ id, ...req.body });
    
    res.json({
      success: true,
      data: goal
    });
  } catch (error) {
    console.error('Error updating nutrition goal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/nutrition/goals/:id
 * Remove meta nutricional
 */
router.delete('/goals/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await nutritionGoalService.deleteNutritionGoal(id);
    
    res.json({
      success: true,
      message: 'Nutrition goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting nutrition goal:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// LABORATORY EXAM ROUTES
// ============================================================================

/**
 * POST /api/nutrition/laboratory-exams
 * Cria novo exame laboratorial
 */
router.post('/laboratory-exams', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const examData = {
      ...req.body,
      tenantId: req.user.tenantId,
      clientId: req.user.id
    };

    const exam = await laboratoryExamService.createExam(examData);
    
    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Error creating laboratory exam:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/laboratory-exams
 * Lista exames laboratoriais
 */
router.get('/laboratory-exams', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { clientId, examType, startDate, endDate, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      clientId: (clientId as string) || req.user.id,
      examType: examType as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const exams = await laboratoryExamService.getClientExams(filters);
    
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Error getting laboratory exams:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/laboratory-exams/:id
 * Busca exame laboratorial específico
 */
router.get('/laboratory-exams/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await laboratoryExamService.getExamById(id);
    
    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        error: 'Laboratory exam not found' 
      });
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    console.error('Error getting laboratory exam:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/nutrition/laboratory-exams/:id/results
 * Adiciona resultado ao exame
 */
router.post('/laboratory-exams/:id/results', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const resultData = {
      ...req.body,
      examId: id
    };

    const result = await laboratoryExamService.addExamResult(resultData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error adding exam result:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/nutrition/laboratory-exams/:id/analyze
 * Inicia análise de exame com IA
 */
router.post('/laboratory-exams/:id/analyze', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { analysisType, inputData } = req.body;

    const analysis = await laboratoryExamService.startExamAnalysis(id, analysisType, inputData);
    
    res.status(201).json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error starting exam analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// SUPPLEMENT PRESCRIPTION ROUTES
// ============================================================================

/**
 * POST /api/nutrition/supplement-prescriptions
 * Cria nova prescrição de suplemento
 */
router.post('/supplement-prescriptions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const prescriptionData = {
      ...req.body,
      tenantId: req.user.tenantId,
      nutritionistId: req.user.id
    };

    const prescription = await supplementPrescriptionService.createPrescription(prescriptionData);
    
    res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error creating supplement prescription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/supplement-prescriptions
 * Lista prescrições de suplementos
 */
router.get('/supplement-prescriptions', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { clientId, nutritionistId, isActive, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      clientId: clientId as string,
      nutritionistId: nutritionistId as string,
      isActive: isActive ? isActive === 'true' : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const prescriptions = await supplementPrescriptionService.getPrescriptions(filters);
    
    res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    console.error('Error getting supplement prescriptions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/supplement-prescriptions/:id
 * Busca prescrição de suplemento específica
 */
router.get('/supplement-prescriptions/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await supplementPrescriptionService.getPrescriptionById(id);
    
    if (!prescription) {
      return res.status(404).json({ 
        success: false, 
        error: 'Supplement prescription not found' 
      });
    }

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error getting supplement prescription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * PUT /api/nutrition/supplement-prescriptions/:id
 * Atualiza prescrição de suplemento
 */
router.put('/supplement-prescriptions/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await supplementPrescriptionService.updatePrescription({ id, ...req.body });
    
    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error updating supplement prescription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * POST /api/nutrition/supplement-prescriptions/:id/complete
 * Finaliza prescrição de suplemento
 */
router.post('/supplement-prescriptions/:id/complete', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const prescription = await supplementPrescriptionService.completePrescription(id, notes);
    
    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('Error completing supplement prescription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * DELETE /api/nutrition/supplement-prescriptions/:id
 * Remove prescrição de suplemento
 */
router.delete('/supplement-prescriptions/:id', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await supplementPrescriptionService.deletePrescription(id);
    
    res.json({
      success: true,
      message: 'Supplement prescription deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplement prescription:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// STATISTICS ROUTES
// ============================================================================

/**
 * GET /api/nutrition/stats/client/:clientId
 * Busca estatísticas do cliente
 */
router.get('/stats/client/:clientId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const [
      mealPlanStats,
      diaryStats,
      goalStats,
      examStats,
      prescriptionStats
    ] = await Promise.all([
      mealPlanService.getMealPlanStats(req.user.tenantId),
      foodDiaryService.getFoodDiaryStats(req.user.tenantId),
      nutritionGoalService.getNutritionGoalStats(req.user.tenantId),
      Promise.resolve({}), // laboratoryExamService.getExamStats not implemented
      Promise.resolve({}) // supplementPrescriptionService.getPrescriptionStats not implemented
    ]);

    const stats = {
      mealPlans: mealPlanStats,
      foodDiary: diaryStats,
      goals: goalStats,
      laboratoryExams: examStats,
      supplementPrescriptions: prescriptionStats
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting client nutrition stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * GET /api/nutrition/stats/professional/:nutritionistId
 * Busca estatísticas do nutricionista
 */
router.get('/stats/professional/:nutritionistId', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { nutritionistId } = req.params;
    
    const [
      clientStats,
      consultationStats,
      mealPlanStats,
      prescriptionStats
    ] = await Promise.all([
      Promise.resolve({}), // nutritionClientService.getClientStats not implemented
      Promise.resolve({}), // nutritionConsultationService.getConsultationStats not implemented
      mealPlanService.getMealPlanStats(req.user.tenantId),
      Promise.resolve({}) // supplementPrescriptionService.getPrescriptionStats not implemented
    ]);

    const stats = {
      clients: clientStats,
      consultations: consultationStats,
      mealPlans: mealPlanStats,
      supplementPrescriptions: prescriptionStats
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting professional nutrition stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// ============================================================================
// HEALTH CHECK ROUTES
// ============================================================================

/**
 * GET /api/nutrition/health
 * Health check do módulo nutricional
 */
router.get('/health', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const [
      foodDatabaseHealth,
      mealPlanHealth,
      recipeHealth,
      foodDiaryHealth,
      professionalHealth,
      clientHealth,
      consultationHealth,
      goalHealth,
      examHealth,
      prescriptionHealth
    ] = await Promise.all([
      foodDatabaseService.healthCheck(),
      mealPlanService.healthCheck(),
      recipeService.healthCheck(),
      foodDiaryService.healthCheck(),
      nutritionProfessionalService.healthCheck(),
      nutritionClientService.healthCheck(),
      nutritionConsultationService.healthCheck(),
      nutritionGoalService.healthCheck(),
      laboratoryExamService.healthCheck(),
      supplementPrescriptionService.healthCheck()
    ]);

    const health = {
      status: 'healthy',
      services: {
        foodDatabase: foodDatabaseHealth,
        mealPlan: mealPlanHealth,
        recipe: recipeHealth,
        foodDiary: foodDiaryHealth,
        professional: professionalHealth,
        client: clientHealth,
        consultation: consultationHealth,
        goal: goalHealth,
        exam: examHealth,
        prescription: prescriptionHealth
      },
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error checking nutrition module health:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

export default router;
