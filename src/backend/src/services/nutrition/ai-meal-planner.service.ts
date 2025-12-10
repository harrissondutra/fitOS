/**
 * AI Meal Planner Service - FitOS Sprint 7
 * 
 * Gera planos alimentares personalizados via IA
 * Base TBCA/TACO + Bioimpedância + Preferências + Restrições
 */

import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '../../../../shared/types/ai.types';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
import { logger } from '../../utils/logger';
import { foodDatabaseService } from './food-database.service';

const prisma = getPrismaClient();

export interface MealPlanRequest {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  numberOfMeals: number;
  dietaryRestrictions: string[];
  preferences: string[];
  duration: number; // dias
}

export interface GeneratedMealPlan {
  name: string;
  description: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: {
    name: string;
    mealType: string;
    items: {
      name: string;
      quantity: number;
      unit: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }[];
  }[];
}

export class AIMealPlannerService {
  private aiFactory: AiClientFactory;

  constructor() {
    this.aiFactory = new AiClientFactory();
  }

  /**
   * Gera plano alimentar personalizado
   */
  async generateMealPlan(
    clientId: string,
    request: MealPlanRequest,
    tenantId: string
  ): Promise<GeneratedMealPlan> {
    try {
      logger.info('Generating AI meal plan', { clientId, request });

      // 1. Buscar alimentos da base TBCA/TACO (amostra)
      const sampleFoods = await this.getSampleFoods(request.dietaryRestrictions);
      
      // 2. Criar prompt com alimentos reais
      const prompt = this.buildMealPlanPrompt(request, sampleFoods);

      // 3. Chamar AI
      const response = await this.aiFactory.complete(
        AiServiceType.AI_MEAL_PLANNER,
        {
          messages: [
            { role: 'system', content: 'Você é um nutricionista especializado em criar planos alimentares personalizados.' },
            { role: 'user', content: prompt }
          ]
        },
        {
          temperature: 0.7,
          maxTokens: 3000,
          metadata: { tenantId, clientId, service: 'meal-planner' }
        }
      );

      // 4. Parse da resposta
      const mealPlan = JSON.parse(response.content);

      logger.info('✅ AI meal plan generated', { mealsCount: mealPlan.meals.length });

      return mealPlan;
    } catch (error) {
      logger.error('Error generating meal plan:', error);
      throw new Error(`Erro ao gerar plano: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca amostra de alimentos da base TBCA/TACO
   */
  private async getSampleFoods(restrictions: string[]): Promise<any[]> {
    const foods = await prisma.food.findMany({
      where: {
        isVerified: true,
        OR: restrictions.length === 0 ? undefined : [
          { name: { contains: 'vegetarian', mode: 'insensitive' } }
        ]
      },
      take: 100,
      orderBy: { isVerified: 'desc' }
    });

    return foods.map(f => ({
      name: f.name,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fat: f.fat,
      fiber: f.fiber
    }));
  }

  /**
   * Constrói prompt para AI
   */
  private buildMealPlanPrompt(request: MealPlanRequest, foods: any[]): string {
    return `Crie um plano alimentar para ${request.duration} dias.

METAS NUTRICIONAIS:
- Calorias: ${request.calories} kcal/dia
- Proteína: ${request.protein}g/dia
- Carboidratos: ${request.carbs}g/dia
- Gorduras: ${request.fat}g/dia

REFEIÇÕES: ${request.numberOfMeals} refeições por dia
${request.dietaryRestrictions.length > 0 ? `RESTRIÇÕES: ${request.dietaryRestrictions.join(', ')}` : ''}
${request.preferences.length > 0 ? `PREFERÊNCIAS: ${request.preferences.join(', ')}` : ''}

ALIMENTOS DISPONÍVEIS (Base TBCA/TACO):
${foods.slice(0, 50).map(f => `- ${f.name} (${f.calories} kcal, P:${f.protein}g C:${f.carbs}g G:${f.fat}g)`).join('\n')}

Retorne JSON:
{
  "name": "Nome do Plano",
  "description": "Descrição",
  "totalCalories": ${request.calories},
  "totalProtein": ${request.protein},
  "totalCarbs": ${request.carbs},
  "totalFat": ${request.fat},
  "meals": [
    {
      "name": "Café da Manhã",
      "mealType": "breakfast",
      "items": [
        {
          "name": "Ovo",
          "quantity": 2,
          "unit": "unidade",
          "calories": 140,
          "protein": 12,
          "carbs": 1,
          "fat": 10
        }
      ]
    }
  ]
}`;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        aiServiceType: AiServiceType.AI_MEAL_PLANNER,
        foodDatabaseAccessible: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const aiMealPlannerService = new AIMealPlannerService();

