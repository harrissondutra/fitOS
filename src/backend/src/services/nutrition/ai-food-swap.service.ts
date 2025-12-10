/**
 * AI Food Swap Service - FitOS Sprint 7
 * 
 * Sugere substituições nutricionais inteligentes
 * Encontra alternativas mais saudáveis ou similares
 */

import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '../../../../shared/types/ai.types';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
import { logger } from '../../utils/logger';

const prisma = getPrismaClient();

export interface FoodSwap {
  original: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  alternatives: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    benefit: string;
  }[];
}

export class AIFoodSwapService {
  private aiFactory: AiClientFactory;

  constructor() {
    this.aiFactory = new AiClientFactory();
  }

  /**
   * Sugere alternativas para um alimento
   */
  async suggestAlternatives(
    foodName: string,
    goal: 'healthier' | 'similar' | 'more_protein' | 'less_calories',
    tenantId: string
  ): Promise<FoodSwap> {
    try {
      logger.info('Finding food alternatives', { foodName, goal });

      // 1. Buscar alimento original
      const original = await prisma.food.findFirst({
        where: {
          name: { contains: foodName, mode: 'insensitive' }
        }
      });

      if (!original) {
        throw new Error(`Alimento "${foodName}" não encontrado`);
      }

      // 2. Buscar alternativas na base TBCA/TACO
      const alternatives = await this.findAlternatives(original, goal);

      // 3. Prompt para AI ordenar e justificar
      const prompt = this.buildSwapPrompt(original, alternatives, goal);

      const response = await this.aiFactory.complete(
        AiServiceType.FOOD_SWAP_SUGGESTIONS,
        {
          messages: [
            { role: 'system', content: 'Você é um nutricionista especializado em substituições alimentares.' },
            { role: 'user', content: prompt }
          ]
        },
        {
          temperature: 0.5,
          maxTokens: 1000,
          metadata: { tenantId, service: 'food-swap' }
        }
      );

      // 4. Parse resposta
      const result = JSON.parse(response.content);

      logger.info('✅ Food swap suggestions generated', { alternativesCount: result.alternatives.length });

      return result;
    } catch (error) {
      logger.error('Error finding alternatives:', error);
      throw new Error(`Erro ao buscar alternativas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private async findAlternatives(original: any, goal: string): Promise<any[]> {
    let query: any = { isVerified: true };

    switch (goal) {
      case 'healthier':
        query = {
          ...query,
          calories: { lte: original.calories },
          fiber: { gte: (original.fiber || 0) }
        };
        break;
      case 'more_protein':
        query = {
          ...query,
          protein: { gte: original.protein }
        };
        break;
      case 'less_calories':
        query = {
          ...query,
          calories: { lte: original.calories * 0.8 }
        };
        break;
      default:
        // similar
        query = {
          ...query,
          calories: {
            gte: original.calories * 0.8,
            lte: original.calories * 1.2
          }
        };
    }

    return await prisma.food.findMany({
      where: query,
      take: 10
    });
  }

  private buildSwapPrompt(original: any, alternatives: any[], goal: string): string {
    const goalText = {
      'healthier': 'MAIS SAUDÁVEL (menos calorias, mais fibras)',
      'similar': 'SIMILAR (mesmo perfil nutricional)',
      'more_protein': 'MAIS PROTEÍNA (hipertrofia)',
      'less_calories': 'MENOS CALORIAS (perda de peso)'
    }[goal];

    return `Sugira 3 melhores alternativas para: ${original.name}

OBJETIVO: ${goalText}

ORIGINAL:
- Calorias: ${original.calories} kcal
- Proteína: ${original.protein}g
- Carboidratos: ${original.carbs}g
- Gorduras: ${original.fat}g

ALTERNATIVAS:
${alternatives.map(a => `${a.name} (${a.calories} kcal, P:${a.protein}g C:${a.carbs}g G:${a.fat}g)`).join('\n')}

Retorne JSON:
{
  "original": {
    "name": "${original.name}",
    "calories": ${original.calories},
    "protein": ${original.protein},
    "carbs": ${original.carbs},
    "fat": ${original.fat}
  },
  "alternatives": [
    {
      "name": "alternativa1",
      "calories": 100,
      "protein": 10,
      "carbs": 5,
      "fat": 3,
      "benefit": "Razão da troca"
    }
  ]
}`;
  }

  async healthCheck() {
    return {
      status: 'healthy',
      aiServiceType: AiServiceType.FOOD_SWAP_SUGGESTIONS
    };
  }
}

export const aiFoodSwapService = new AIFoodSwapService();

