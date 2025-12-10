/**
 * Anamnese AI Service - Sprint 7
 * Anamnese nutricional automática usando AI Provider configurável
 */

import { logger } from '../../utils/logger';
import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '../../../../shared/types/ai.types';

export interface ClientData {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  goals: string[];
  dietaryRestrictions?: string[];
  medicalHistory?: string[];
  lifestyle?: {
    activityLevel?: string;
    workSchedule?: string;
    sleepHours?: number;
  };
}

export interface AnamnesisResult {
  dietaryPattern: string;
  nutritionalNeeds: string[];
  potentialDeficiencies: string[];
  recommendations: string[];
  suggestedNutrients: string[];
  mealTiming: string;
  hydrationAdvice: string;
}

export class AnamnesisAIService {
  private aiClientFactory: AiClientFactory;

  constructor() {
    this.aiClientFactory = new AiClientFactory();
  }

  /**
   * Gerar anamnese nutricional automática
   */
  async generateAnamnesis(data: ClientData): Promise<AnamnesisResult> {
    try {
      // 1. Preparar prompt
      const prompt = this.buildAnamnesisPrompt(data);

      // 2. Chamar AI Provider configurável
      const response = await this.aiClientFactory.complete(
        AiServiceType.NUTRITION,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 2000
        }
      );

      // 3. Parsear resposta
      const anamnesis = this.parseAnamnesisResponse(response.content, data);

      logger.info('Anamnese generated successfully', {
        clientName: data.name,
        goals: data.goals
      });

      return anamnesis;

    } catch (error) {
      logger.error('Error generating anamnesis:', error);
      throw error;
    }
  }

  /**
   * Construir prompt para anamnese
   */
  private buildAnamnesisPrompt(data: ClientData): string {
    const goalsText = data.goals.join(', ');
    const restrictionsText = data.dietaryRestrictions?.join(', ') || 'Nenhuma';
    const historyText = data.medicalHistory?.join(', ') || 'Nenhuma';
    
    return `Você é um nutricionista especializado. Gere uma anamnese nutricional completa.

Dados do cliente:
- Nome: ${data.name}
- Idade: ${data.age}
- Gênero: ${data.gender}
- Objetivos: ${goalsText}
- Restrições alimentares: ${restrictionsText}
- Histórico médico: ${historyText}
- Estilo de vida: ${data.lifestyle ? JSON.stringify(data.lifestyle) : 'Não informado'}

Analise e forneça:
1. Padrão alimentar sugerido
2. Necessidades nutricionais
3. Potenciais deficiências
4. Recomendações específicas
5. Nutrientes a priorizar
6. Timing de refeições
7. Orientação sobre hidratação

Formato JSON:
{
  "dietaryPattern": "padrão",
  "nutritionalNeeds": ["needed1", "needed2"],
  "potentialDeficiencies": ["def1", "def2"],
  "recommendations": ["rec1", "rec2"],
  "suggestedNutrients": ["nut1", "nut2"],
  "mealTiming": "orientação",
  "hydrationAdvice": "orientação"
}`;
  }

  /**
   * Parsear resposta
   */
  private parseAnamnesisResponse(aiResponse: string, clientData: ClientData): AnamnesisResult {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
      
      const parsed = JSON.parse(jsonText);
      
      return {
        dietaryPattern: parsed.dietaryPattern || 'Equilibrado',
        nutritionalNeeds: parsed.nutritionalNeeds || [],
        potentialDeficiencies: parsed.potentialDeficiencies || [],
        recommendations: parsed.recommendations || [],
        suggestedNutrients: parsed.suggestedNutrients || [],
        mealTiming: parsed.mealTiming || 'Flexível',
        hydrationAdvice: parsed.hydrationAdvice || 'Beber 2-3 litros por dia'
      };
      
    } catch (error) {
      logger.error('Error parsing anamnesis response:', error);
      
      return {
        dietaryPattern: 'Dieta equilibrada',
        nutritionalNeeds: [],
        potentialDeficiencies: [],
        recommendations: ['Consulte nutricionista para plano personalizado'],
        suggestedNutrients: [],
        mealTiming: 'Ajustar conforme rotina',
        hydrationAdvice: 'Manter hidratação adequada'
      };
    }
  }

  /**
   * Analisar compatibilidade de objetivos
   */
  async analyzeGoalCompatibility(
    goals: string[],
    clientData: ClientData
  ): Promise<{
    compatibleGoals: string[];
    conflictingGoals: string[];
    timelineSuggestions: Record<string, string>;
  }> {
    const prompt = `Analise os objetivos de nutrição e identifique compatibilidades:

Objetivos: ${goals.join(', ')}
Cliente: ${clientData.age} anos, ${clientData.gender}

Forneça JSON:
{
  "compatibleGoals": ["obj1", "obj2"],
  "conflictingGoals": ["obj1", "obj2"],
  "timelineSuggestions": {
    "goal1": "timeline1",
    "goal2": "timeline2"
  }
}`;

    try {
      const response = await this.aiClientFactory.complete(
        AiServiceType.NUTRITION,
        prompt,
        { temperature: 0.7, maxTokens: 1000 }
      );

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch?.[0] || '{}');
      
    } catch (error) {
      logger.error('Error analyzing goal compatibility:', error);
      return {
        compatibleGoals: goals,
        conflictingGoals: [],
        timelineSuggestions: {}
      };
    }
  }
}

export default new AnamnesisAIService();

