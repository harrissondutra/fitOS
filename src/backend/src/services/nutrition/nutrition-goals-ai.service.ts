/**
 * Nutrition Goals AI Service - Sprint 7
 * Geração automática de metas nutricionais usando AI Provider configurável
 */

import { logger } from '../../utils/logger';
import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '../../../../shared/types/ai.types';

export interface ClientProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activityLevel: string;
  goals: string[];
  dietaryRestrictions?: string[];
  medicalConditions?: string[];
  lifestyle?: {
    workSchedule?: string;
    sleepHours?: number;
    stressLevel?: string;
  };
}

export interface NutritionGoal {
  category: 'weight' | 'nutrient' | 'habit' | 'performance';
  goal: string;
  targetValue?: number;
  timeframe: string;
  priority: 'high' | 'medium' | 'low';
  steps: string[];
  measurable: boolean;
}

export class NutritionGoalsAIService {
  private aiClientFactory: AiClientFactory;

  constructor() {
    this.aiClientFactory = new AiClientFactory();
  }

  /**
   * Gerar metas nutricionais personalizadas
   */
  async generateGoals(profile: ClientProfile): Promise<NutritionGoal[]> {
    try {
      const prompt = this.buildGoalsPrompt(profile);
      
      const response = await this.aiClientFactory.complete(
        AiServiceType.NUTRITION,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 3000
        }
      );

      const goals = this.parseGoalsResponse(response.content);
      
      logger.info('Nutrition goals generated successfully', {
        clientGoals: profile.goals,
        generatedGoals: goals.length
      });

      return goals;

    } catch (error) {
      logger.error('Error generating nutrition goals:', error);
      throw error;
    }
  }

  /**
   * Analisar progresso e ajustar metas
   */
  async analyzeProgress(
    goals: NutritionGoal[],
    progressData: any
  ): Promise<{
    onTrackGoals: NutritionGoal[];
    behindGoals: NutritionGoal[];
    achievedGoals: NutritionGoal[];
    suggestions: string[];
  }> {
    try {
      const prompt = this.buildProgressPrompt(goals, progressData);
      
      const response = await this.aiClientFactory.complete(
        AiServiceType.NUTRITION,
        prompt,
        {
          temperature: 0.6,
          maxTokens: 2000
        }
      );

      const analysis = this.parseProgressResponse(response.content);
      
      return analysis;

    } catch (error) {
      logger.error('Error analyzing progress:', error);
      throw error;
    }
  }

  /**
   * Construir prompt para geração de metas
   */
  private buildGoalsPrompt(profile: ClientProfile): string {
    return `Você é um nutricionista experiente. Gere metas nutricionais personalizadas.

Perfil do Cliente:
- Idade: ${profile.age} anos
- Gênero: ${profile.gender}
- Peso: ${profile.weight} kg
- Altura: ${profile.height} cm
- Nível de atividade: ${profile.activityLevel}
- Objetivos: ${profile.goals.join(', ')}
- Restrições: ${profile.dietaryRestrictions?.join(', ') || 'Nenhuma'}
- Condições médicas: ${profile.medicalConditions?.join(', ') || 'Nenhuma'}

Lifestyle:
- Horário de trabalho: ${profile.lifestyle?.workSchedule || 'Não informado'}
- Horas de sono: ${profile.lifestyle?.sleepHours || 'Não informado'}
- Nível de estresse: ${profile.lifestyle?.stressLevel || 'Não informado'}

Gere metas SMART (específicas, mensuráveis, alcançáveis, relevantes, temporais) em JSON:

{
  "goals": [
    {
      "category": "weight|nutrient|habit|performance",
      "goal": "descrição específica",
      "targetValue": número ou null,
      "timeframe": "4 semanas",
      "priority": "high|medium|low",
      "steps": ["passo 1", "passo 2", "passo 3"],
      "measurable": true
    }
  ]
}`;
  }

  /**
   * Parsear resposta da AI
   */
  private parseGoalsResponse(aiResponse: string): NutritionGoal[] {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
      
      const parsed = JSON.parse(jsonText);
      
      return parsed.goals || [];

    } catch (error) {
      logger.error('Error parsing goals response:', error);
      
      return [{
        category: 'habit',
        goal: 'Seguir orientações nutricionais do profissional',
        timeframe: '4 semanas',
        priority: 'high',
        steps: ['Estabelecer rotina alimentar', 'Monitorar progresso'],
        measurable: false
      }];
    }
  }

  /**
   * Construir prompt para análise de progresso
   */
  private buildProgressPrompt(goals: NutritionGoal[], progressData: any): string {
    return `Analise o progresso das metas nutricionais do cliente.

Metas iniciais:
${JSON.stringify(goals, null, 2)}

Dados de progresso:
${JSON.stringify(progressData, null, 2)}

Forneça análise em JSON:
{
  "onTrackGoals": [...],
  "behindGoals": [...],
  "achievedGoals": [...],
  "suggestions": ["sugestão1", "sugestão2"]
}`;
  }

  /**
   * Parsear análise de progresso
   */
  private parseProgressResponse(aiResponse: string): {
    onTrackGoals: NutritionGoal[];
    behindGoals: NutritionGoal[];
    achievedGoals: NutritionGoal[];
    suggestions: string[];
  } {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
      
      const parsed = JSON.parse(jsonText);
      
      return {
        onTrackGoals: parsed.onTrackGoals || [],
        behindGoals: parsed.behindGoals || [],
        achievedGoals: parsed.achievedGoals || [],
        suggestions: parsed.suggestions || []
      };

    } catch (error) {
      logger.error('Error parsing progress response:', error);
      
      return {
        onTrackGoals: [],
        behindGoals: [],
        achievedGoals: [],
        suggestions: ['Continue seguindo o plano']
      };
    }
  }
}

export default new NutritionGoalsAIService();

