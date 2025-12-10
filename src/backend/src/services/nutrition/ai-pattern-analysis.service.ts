/**
 * AI Pattern Analysis Service - FitOS Sprint 7
 * 
 * Analisa padrões alimentares de 30 dias
 * Identifica: hábitos, deficiências, melhorias
 */

import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '../../../shared/types/ai.types';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { foodDiaryService } from './food-diary.service';

const prisma = new PrismaClient();

export interface PatternAnalysis {
  habits: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  adherenceTrend: number;
  nutritionalGaps: string[];
}

export class AIPatternAnalysisService {
  private aiFactory: AiClientFactory;

  constructor() {
    this.aiFactory = new AiClientFactory();
  }

  /**
   * Analisa padrões dos últimos 30 dias
   */
  async analyzePatterns(
    clientId: string,
    tenantId: string
  ): Promise<PatternAnalysis> {
    try {
      logger.info('Analyzing eating patterns', { clientId });

      // 1. Buscar dados dos últimos 30 dias
      const last30Days = await foodDiaryService.getClientStats(clientId, 30);
      
      // 2. Buscar histórico detalhado
      const entries = await prisma.foodDiaryEntry.findMany({
        where: {
          clientId,
          consumedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // 3. Preparar dados para AI
      const analysisData = this.prepareAnalysisData(last30Days, entries);

      // 4. Prompt para AI
      const prompt = this.buildAnalysisPrompt(analysisData);

      // 5. Chamar AI
      const response = await this.aiFactory.complete(
        AiServiceType.PATTERN_ANALYSIS,
        {
          messages: [
            { role: 'system', content: 'Você é um especialista em análise comportamental nutricional.' },
            { role: 'user', content: prompt }
          ]
        },
        {
          temperature: 0.5,
          maxTokens: 1500,
          metadata: { tenantId, clientId, service: 'pattern-analysis' }
        }
      );

      // 6. Parse resposta
      const analysis = JSON.parse(response.content);

      logger.info('✅ Pattern analysis completed', { recommendationsCount: analysis.recommendations.length });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing patterns:', error);
      throw new Error(`Erro ao analisar padrões: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private prepareAnalysisData(stats: any, entries: any[]) {
    return {
      totalCalories: stats.totals.calories,
      totalProtein: stats.totals.protein,
      avgCaloriesPerDay: stats.averages.caloriesPerDay,
      mealsPerDay: stats.averages.entriesPerDay,
      uniqueFoods: stats.counts.uniqueFoods,
      mealTypeDistribution: stats.mealTypeCounts,
      entriesByDay: entries.reduce((acc, e) => {
        const day = e.consumedAt.toISOString().split('T')[0];
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private buildAnalysisPrompt(data: any): string {
    return `Analise os dados alimentares dos últimos 30 dias:

ESTATÍSTICAS:
- Total calorias: ${data.totalCalories} kcal
- Total proteína: ${data.totalProtein}g
- Média calorias/dia: ${data.avgCaloriesPerDay} kcal
- Refeições/dia: ${data.mealsPerDay}
- Alimentos únicos: ${data.uniqueFoods}

DISTRIBUIÇÃO POR REFEIÇÃO:
${Object.entries(data.mealTypeDistribution).map(([type, count]) => `- ${type}: ${count} refeições`).join('\n')}

Retorne JSON:
{
  "habits": ["hábito1", "hábito2"],
  "strengths": ["força1", "força2"],
  "weaknesses": ["fraqueza1", "fraqueza2"],
  "recommendations": ["recomendação1", "recomendação2"],
  "adherenceTrend": 75,
  "nutritionalGaps": ["deficiência1"]
}`;
  }

  async healthCheck() {
    return {
      status: 'healthy',
      aiServiceType: AiServiceType.PATTERN_ANALYSIS
    };
  }
}

export const aiPatternAnalysisService = new AIPatternAnalysisService();

