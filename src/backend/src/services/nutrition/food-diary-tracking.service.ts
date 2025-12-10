/**
 * Food Diary Tracking Service - FitOS Sprint 7
 * 
 * Orquestra serviços existentes para fornecer tracking alimentar integrado
 * Conecta: FoodDiaryService + MealPlanService + BioimpedanceService
 * 
 * Pattern: Reutiliza serviços existentes sem duplicar código
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
import { foodDiaryService } from './food-diary.service';
import { mealPlanService } from './meal-plan.service';
import { logger } from '../../utils/logger';

const prisma = getPrismaClient();

export interface AddFoodEntryInput {
  clientId: string;
  tenantId: string;
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
  mealType: string; // breakfast, lunch, dinner, snack
  consumedAt: Date;
  notes?: string;
}

export interface DailyTotalsWithGoals {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  adherence: number;
  meals: any[];
}

export class FoodDiaryTrackingService {
  /**
   * Adiciona alimento ao diário
   * Reutiliza foodDiaryService.addEntry()
   */
  async addFoodEntry(data: AddFoodEntryInput) {
    try {
      logger.info('Adding food entry to diary', {
        clientId: data.clientId,
        foodName: data.name,
        mealType: data.mealType
      });

      // Buscar dados do alimento se foodId foi fornecido
      let foodData = {
        name: data.name,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      };

      if (data.foodId) {
        const food = await prisma.food.findUnique({
          where: { id: data.foodId }
        });

        if (food) {
          // Calcular valores baseado na quantidade
          const factor = data.quantity / 100; // base é 100g
          foodData = {
            name: food.name,
            calories: (food.calories || 0) * factor,
            protein: (food.protein || 0) * factor,
            carbs: (food.carbs || 0) * factor,
            fat: (food.fat || 0) * factor,
            fiber: (food.fiber || 0) * factor
          };
        }
      }

      // Usar foodDiaryService existente (já tem cache Redis)
      const entry = await foodDiaryService.addEntry({
        tenantId: data.tenantId,
        clientId: data.clientId,
        foodId: data.foodId,
        name: foodData.name,
        quantity: data.quantity,
        unit: data.unit,
        mealType: data.mealType,
        consumedAt: data.consumedAt,
        notes: data.notes
      });

      logger.info('✅ Food entry added successfully', { entryId: entry.id });
      return entry;
    } catch (error) {
      logger.error('Error adding food entry:', error);
      throw error;
    }
  }

  /**
   * Busca totais diários COM comparação de metas
   * Integra: FoodDiary + MealPlan + Bioimpedance
   */
  async getDailyTotalsWithGoals(
    clientId: string,
    date: Date
  ): Promise<DailyTotalsWithGoals> {
    try {
      logger.info('Getting daily totals with goals', { clientId, date });

      // 1. Totais consumidos (usa cache Redis do foodDiaryService)
      const summary = await foodDiaryService.getDailyNutritionSummary(clientId, date);

      // 2. Metas do cliente (plano ou bioimpedância)
      const goals = await this.getClientGoals(clientId, date);

      // 3. Calcular aderência ao plano
      const adherence = this.calculateAdherence(summary, goals);

      logger.info('✅ Daily totals calculated', {
        clientId,
        totalCalories: summary.totalCalories,
        goalCalories: goals.calories,
        adherence
      });

      return {
        date: summary.date,
        totalCalories: summary.totalCalories,
        totalProtein: summary.totalProtein,
        totalCarbs: summary.totalCarbs,
        totalFat: summary.totalFat,
        totalFiber: summary.totalFiber,
        goals,
        adherence,
        meals: summary.meals
      };
    } catch (error) {
      logger.error('Error getting daily totals:', error);
      throw error;
    }
  }

  /**
   * Busca histórico de tracking com estatísticas
   */
  async getTrackingHistory(clientId: string, days: number = 30) {
    try {
      logger.info('Getting tracking history', { clientId, days });

      // Usar foodDiaryService.getClientStats (já tem cache)
      const stats = await foodDiaryService.getClientStats(clientId, days);

      return {
        period: stats.period,
        totals: stats.totals,
        averages: stats.averages,
        counts: stats.counts
      };
    } catch (error) {
      logger.error('Error getting tracking history:', error);
      throw error;
    }
  }

  /**
   * Remove entrada do diário
   * Reutiliza foodDiaryService.deleteEntry()
   */
  async deleteEntry(entryId: string, clientId: string) {
    try {
      // Validar que entrada pertence ao cliente
      const entry = await prisma.foodDiaryEntry.findFirst({
        where: {
          id: entryId,
          clientId
        }
      });

      if (!entry) {
        throw new Error('Entry not found or access denied');
      }

      // Usar foodDiaryService existente
      await foodDiaryService.deleteEntry(entryId);

      logger.info('✅ Food entry deleted', { entryId });
      return { success: true };
    } catch (error) {
      logger.error('Error deleting food entry:', error);
      throw error;
    }
  }

  // ============================================================================
  // MÉTODOS PRIVADOS - LÓGICA DE INTEGRAÇÃO
  // ============================================================================

  /**
   * Busca metas do cliente
   * Prioridade: 1) Plano do nutricionista 2) Bioimpedância 3) Default
   */
  private async getClientGoals(clientId: string, date: Date) {
    try {
      // 1. Tentar buscar plano ativo do nutricionista (usa cache do mealPlanService)
      const mealPlan = await mealPlanService.getTodaysMealPlan(clientId);

      if (mealPlan && mealPlan.totalCalories) {
        logger.info('Using meal plan goals', { clientId, source: 'nutritionist' });
        return {
          calories: mealPlan.totalCalories || 2000,
          protein: mealPlan.totalProtein || 120,
          carbs: mealPlan.totalCarbs || 200,
          fat: mealPlan.totalFat || 70
        };
      }

      // 2. Fallback: calcular via bioimpedância
      logger.info('Meal plan not found, using bioimpedance', { clientId });
      return await this.calculateGoalsFromBioimpedance(clientId);
    } catch (error) {
      logger.error('Error getting client goals:', error);
      // Retornar metas default em caso de erro
      return { calories: 2000, protein: 120, carbs: 200, fat: 70 };
    }
  }

  /**
   * Calcula metas baseado na última bioimpedância
   * Usa fórmula Harris-Benedict para TMB e fator de atividade
   */
  private async calculateGoalsFromBioimpedance(clientId: string) {
    try {
      // Buscar última medição de bioimpedância
      const latestBio = await prisma.bioimpedanceMeasurement.findFirst({
        where: { clientId },
        orderBy: { measuredAt: 'desc' }
      });

      if (!latestBio || !latestBio.basalMetabolicRate) {
        logger.warn('No bioimpedance data found, using defaults', { clientId });
        return { calories: 2000, protein: 120, carbs: 200, fat: 70 };
      }

      const bmr = latestBio.basalMetabolicRate;
      const activityFactor = 1.3; // Levemente ativo (padrão)
      const tdee = bmr * activityFactor; // Total Daily Energy Expenditure

      // Calcular macros baseado em TDEE
      // Distribuição: 50% carbs, 25% protein, 25% fat
      const goals = {
        calories: Math.round(tdee),
        protein: Math.round(latestBio.weight * 2.0), // 2g/kg peso
        carbs: Math.round((tdee * 0.50) / 4), // 4 kcal/g
        fat: Math.round((tdee * 0.25) / 9) // 9 kcal/g
      };

      logger.info('Goals calculated from bioimpedance', {
        clientId,
        bmr,
        tdee,
        goals
      });

      return goals;
    } catch (error) {
      logger.error('Error calculating goals from bioimpedance:', error);
      return { calories: 2000, protein: 120, carbs: 200, fat: 70 };
    }
  }

  /**
   * Calcula % de aderência ao plano
   * Considera calorias (60%) + proteína (40%)
   */
  private calculateAdherence(consumed: any, goals: any): number {
    try {
      // Evitar divisão por zero
      if (!goals.calories || !goals.protein) {
        return 0;
      }

      // Calcular aderência de calorias (max 100%)
      const caloriesAdherence = Math.min(
        100,
        (consumed.totalCalories / goals.calories) * 100
      );

      // Calcular aderência de proteína (max 100%)
      const proteinAdherence = Math.min(
        100,
        (consumed.totalProtein / goals.protein) * 100
      );

      // Média ponderada: calorias 60%, proteína 40%
      const totalAdherence = (caloriesAdherence * 0.6) + (proteinAdherence * 0.4);

      return Math.round(totalAdherence);
    } catch (error) {
      logger.error('Error calculating adherence:', error);
      return 0;
    }
  }

  /**
   * Health check do service
   */
  async healthCheck() {
    try {
      // Testar dependências
      const foodDiaryHealth = await foodDiaryService.healthCheck();
      const mealPlanHealth = await mealPlanService.healthCheck();

      return {
        status: 'healthy',
        services: {
          foodDiary: foodDiaryHealth.status,
          mealPlan: mealPlanHealth.status
        },
        redis: foodDiaryHealth.redis
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Instância singleton
export const foodDiaryTrackingService = new FoodDiaryTrackingService();

