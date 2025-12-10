/**
 * AI Food Recognition Service - FitOS Sprint 7
 * 
 * Analisa fotos de comida e identifica alimentos automaticamente
 * Usa AiClientFactory (configurado pelo super admin) + TBCA/TACO database
 * 
 * Integração: AiClientFactory + Food Database + TBCA/TACO
 */

import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '../../../shared/types/ai.types';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { foodDatabaseService } from './food-database.service';

const prisma = new PrismaClient();

export interface DetectedFood {
  nome: string;
  quantidade: number;
  unidade: string;
  confianca: number;
}

export interface FoodRecognitionResult {
  detected: DetectedFood[];
  matched: any[];
  totalCalories?: number;
  message?: string;
}

export class AIFoodRecognitionService {
  private aiFactory: AiClientFactory;

  constructor() {
    this.aiFactory = new AiClientFactory();
  }

  /**
   * Analisa foto de comida e identifica alimentos
   * Usa AiClientFactory - super admin já configurou qual LLM usar
   */
  async analyzeFoodPhoto(
    imageUrl: string,
    tenantId: string
  ): Promise<FoodRecognitionResult> {
    try {
      logger.info('Analyzing food photo with AI', { imageUrl, tenantId });

      const prompt = `Analise esta foto de refeição e identifique TODOS os alimentos visíveis.

Retorne APENAS JSON válido com este formato:
{
  "alimentos": [
    {
      "nome": "arroz branco",
      "quantidade": 150,
      "unidade": "g",
      "confianca": 95
    }
  ],
  "totalCalories": 580,
  "message": "Alimentos identificados: arroz, frango grelhado, salada"
}

IMPORTANTE:
- Liste TODOS os alimentos visíveis
- Estime quantidade em GRAMAS (g) ou UNIDADES
- Nível de confiança 0-100%
- Calcule calorias totais estimadas`;

      // AiClientFactory busca config do super admin (qual LLM usar)
      const response = await this.aiFactory.complete(
        AiServiceType.FOOD_RECOGNITION,
        {
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageUrl } }
              ]
            }
          ]
        },
        {
          temperature: 0.3, // Baixa temperatura para mais consistência
          maxTokens: 1500,
          metadata: {
            tenantId,
            service: 'food-recognition',
            timestamp: new Date().toISOString()
          }
        }
      );

      // Parse resposta
      const detected = JSON.parse(response.content);

      // Match na base TBCA/TACO local
      const matched = await this.matchFoodsInDatabase(detected.alimentos);

      logger.info('✅ Food recognition completed', {
        foodsCount: matched.length,
        totalCalories: detected.totalCalories
      });

      return {
        detected: detected.alimentos,
        matched,
        totalCalories: detected.totalCalories,
        message: detected.message
      };
    } catch (error) {
      logger.error('Error analyzing food photo:', error);
      throw new Error(`Erro ao analisar foto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca alimentos na base TBCA/TACO
   * Tenta match exato, depois fuzzy match
   */
  private async matchFoodsInDatabase(detectedFoods: DetectedFood[]) {
    const matches = [];

    for (const food of detectedFoods) {
      try {
        // 1. Tentar match exato
        let dbFood = await prisma.food.findFirst({
          where: {
            name: { equals: food.nome, mode: 'insensitive' }
          },
          orderBy: { isVerified: 'desc' }
        });

        // 2. Se não encontrou, tentar match parcial
        if (!dbFood) {
          dbFood = await prisma.food.findFirst({
            where: {
              name: { contains: food.nome, mode: 'insensitive' }
            },
            orderBy: [
              { isVerified: 'desc' },
              { matchScore: 'desc' }
            ]
          });
        }

        // 3. Se ainda não encontrou, buscar parcialmente com palavras-chave
        if (!dbFood) {
          const keywords = food.nome.split(' ');
          for (const keyword of keywords) {
            if (keyword.length > 3) { // Ignorar palavras muito curtas
              dbFood = await prisma.food.findFirst({
                where: {
                  name: { contains: keyword, mode: 'insensitive' }
                }
              });
              if (dbFood) break;
            }
          }
        }

        if (dbFood) {
          matches.push({
            foodId: dbFood.id,
            name: dbFood.name,
            estimatedQuantity: food.quantidade,
            estimatedUnit: food.unidade,
            aiConfidence: food.confianca,
            // Dados nutricionais (calculados para a quantidade estimada)
            estimatedMacros: this.calculateNutritionForQuantity(
              dbFood,
              food.quantidade,
              food.unidade
            )
          });
        } else {
          // Não encontrou na base, adicionar como "não identificado"
          matches.push({
            foodId: null,
            name: food.nome,
            estimatedQuantity: food.quantidade,
            estimatedUnit: food.unidade,
            aiConfidence: food.confianca,
            estimatedMacros: null,
            notFound: true
          });
        }
      } catch (error) {
        logger.error('Error matching food in database:', error);
      }
    }

    return matches;
  }

  /**
   * Calcula valores nutricionais para quantidade específica
   */
  private calculateNutritionForQuantity(
    food: any,
    quantity: number,
    unit: string
  ) {
    // Converter para gramas se necessário
    const factor = unit === 'g' 
      ? quantity / 100 
      : (unit === 'unidade' && food.baseUnit === 'unidade')
        ? quantity
        : quantity * (food.baseUnit === 'g' ? 1 : 0.1);

    return {
      calories: Math.round((food.calories || 0) * factor),
      protein: Math.round(((food.protein || 0) * factor) * 100) / 100,
      carbs: Math.round(((food.carbs || 0) * factor) * 100) / 100,
      fat: Math.round(((food.fat || 0) * factor) * 100) / 100,
      fiber: Math.round(((food.fiber || 0) * factor) * 100) / 100
    };
  }

  /**
   * Batch recognition - analisa múltiplas fotos
   */
  async analyzeMultiplePhotos(
    imageUrls: string[],
    tenantId: string
  ): Promise<FoodRecognitionResult[]> {
    const results = [];

    for (const imageUrl of imageUrls) {
      try {
        const result = await this.analyzeFoodPhoto(imageUrl, tenantId);
        results.push(result);
      } catch (error) {
        logger.error('Error analyzing photo:', error);
        results.push({
          detected: [],
          matched: [],
          message: 'Erro ao analisar foto'
        });
      }
    }

    return results;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      // Testar acesso ao AI Factory
      const canAccessAI = this.aiFactory !== null;
      
      // Testar acesso à base de dados
      const foodCount = await prisma.food.count();

      return {
        status: 'healthy',
        aiAccessible: canAccessAI,
        foodDatabaseItems: foodCount,
        aiServiceType: AiServiceType.FOOD_RECOGNITION
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
export const aiFoodRecognitionService = new AIFoodRecognitionService();

