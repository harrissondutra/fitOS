/**
 * AI Nutrition Coach Service - FitOS Sprint 7
 * 
 * Assistente nutricional 24/7 via chat
 * Responde dúvidas, sugere substituições, motiva
 * Usa AiClientFactory (configurado pelo super admin)
 */

import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '../../../shared/types/ai.types';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { mealPlanService } from './meal-plan.service';

const prisma = new PrismaClient();

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface NutritionCoachContext {
  clientGoals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  currentProgress: {
    calories: number;
    protein: number;
    adherence: number;
  };
  dietaryRestrictions: string[];
  preferences: string[];
}

export class AINutritionCoachService {
  private aiFactory: AiClientFactory;

  constructor() {
    this.aiFactory = new AiClientFactory();
  }

  /**
   * Chat com assistente nutricional
   * Contexto: objetivos, progresso atual, restrições
   */
  async chat(
    clientId: string,
    message: string,
    tenantId: string,
    history: ChatMessage[] = []
  ): Promise<{ response: string; suggestions?: string[] }> {
    try {
      logger.info('Processing nutrition coach chat', { clientId, messageLength: message.length });

      // 1. Buscar contexto do cliente
      const context = await this.getClientContext(clientId);
      const systemPrompt = this.buildSystemPrompt(context);

      // 2. Preparar mensagens para AI
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: message }
      ];

      // 3. Chamar AI via AiClientFactory
      const response = await this.aiFactory.complete(
        AiServiceType.NUTRITION_COACH_CHAT,
        {
          messages
        },
        {
          temperature: 0.7,
          maxTokens: 500,
          metadata: {
            tenantId,
            clientId,
            service: 'nutrition-coach-chat'
          }
        }
      );

      // 4. Extrair sugestões se houver
      const suggestions = this.extractSuggestions(response.content);

      logger.info('✅ Nutrition coach response generated', { hasSuggestions: !!suggestions });

      return {
        response: response.content,
        suggestions
      };
    } catch (error) {
      logger.error('Error in nutrition coach chat:', error);
      throw new Error(`Erro ao processar chat: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  /**
   * Busca contexto do cliente (metas, progresso, restrições)
   */
  private async getClientContext(clientId: string): Promise<NutritionCoachContext> {
    try {
      // 1. Buscar cliente
      const client = await prisma.nutritionClient.findUnique({
        where: { id: clientId },
        include: {
          mealPlans: {
            where: { isActive: true },
            take: 1
          }
        }
      });

      // 2. Buscar plano ativo
      const mealPlan = client?.mealPlans[0];
      
      // 3. Buscar progresso do dia
      const today = new Date();
      const summary = await prisma.foodDiaryEntry.aggregate({
        where: {
          clientId,
          consumedAt: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lte: new Date(today.setHours(23, 59, 59, 999))
          }
        },
        _sum: {
          calories: true,
          protein: true
        }
      });

      return {
        clientGoals: {
          calories: mealPlan?.totalCalories || 2000,
          protein: mealPlan?.totalProtein || 120,
          carbs: mealPlan?.totalCarbs || 200,
          fat: mealPlan?.totalFat || 70
        },
        currentProgress: {
          calories: summary._sum.calories || 0,
          protein: summary._sum.protein || 0,
          adherence: 0 // Calculado separadamente
        },
        dietaryRestrictions: (client?.dietaryRestrictions as string[]) || [],
        preferences: (client?.preferences as string[]) || []
      };
    } catch (error) {
      logger.error('Error getting client context:', error);
      return {
        clientGoals: { calories: 2000, protein: 120, carbs: 200, fat: 70 },
        currentProgress: { calories: 0, protein: 0, adherence: 0 },
        dietaryRestrictions: [],
        preferences: []
      };
    }
  }

  /**
   * Monta system prompt com contexto do cliente
   */
  private buildSystemPrompt(context: NutritionCoachContext): string {
    return `Você é um assistente nutricional profissional e empático.

META DO CLIENTE:
- Calorias: ${context.clientGoals.calories} kcal/dia
- Proteína: ${context.clientGoals.protein}g/dia
- Carboidratos: ${context.clientGoals.carbs}g/dia
- Gorduras: ${context.clientGoals.fat}g/dia

PROGRESSO ATUAL (HOJE):
- Calorias consumidas: ${context.currentProgress.calories} kcal
- Proteína consumida: ${context.currentProgress.protein}g

${context.dietaryRestrictions.length > 0 ? `RESTRIÇÕES: ${context.dietaryRestrictions.join(', ')}` : ''}
${context.preferences.length > 0 ? `PREFERÊNCIAS: ${context.preferences.join(', ')}` : ''}

DIRETRIZES:
- Seja prático e motivador
- Sugira substituições saudáveis quando apropriado
- Ajude a atingir as metas calóricas
- Responda dúvidas sobre nutrição de forma clara
- Use linguagem brasileira e cotidiana
- Seja breve (máximo 150 palavras)

IMPORTANTE: NÃO prescreva medicamentos ou suplementos sem receita médica.`;
  }

  /**
   * Extrai sugestões do texto da AI
   */
  private extractSuggestions(text: string): string[] | undefined {
    // Tentar encontrar lista marcada
    const suggestionPattern = /(?:💡|⚡|💬).*?(?=\n|$)/g;
    const matches = text.match(suggestionPattern);
    
    if (matches && matches.length > 0) {
      return matches.map(m => m.replace(/^(💡|⚡|💬)\s*/, '').trim());
    }

    return undefined;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const canAccessAI = this.aiFactory !== null;

      return {
        status: 'healthy',
        aiAccessible: canAccessAI,
        aiServiceType: AiServiceType.NUTRITION_COACH_CHAT
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
export const aiNutritionCoachService = new AINutritionCoachService();

