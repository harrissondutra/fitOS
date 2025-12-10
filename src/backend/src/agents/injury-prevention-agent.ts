/**
 * Injury Prevention Agent - Sprint 7
 * IA para prevenção de lesões usando AI Provider configurável
 */

import { logger } from '../utils/logger';
import { AiClientFactory } from '../services/ai-client.factory';
import { AiServiceType } from '../../../shared/types/ai.types';

export interface InjuryPreventionData {
  workoutHistory?: any[];
  currentSymptoms?: string[];
  demographics: {
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: string;
  };
  currentProgram?: any;
}

export interface InjuryPreventionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  potentialInjuries: Array<{
    name: string;
    probability: number;
    preventionTips: string[];
  }>;
  recommendations: string[];
  modifications: Array<{
    exercise: string;
    modification: string;
    reason: string;
  }>;
}

export class InjuryPreventionAgent {
  private aiClientFactory: AiClientFactory;

  constructor() {
    this.aiClientFactory = new AiClientFactory();
  }

  /**
   * Analisar risco de lesões usando AI Provider configurável
   */
  async analyzeInjuryRisk(data: InjuryPreventionData): Promise<InjuryPreventionResult> {
    try {
      // 1. Preparar prompt
      const prompt = this.buildAnalysisPrompt(data);

      // 2. Chamar AI Provider configurável
      const response = await this.aiClientFactory.complete(
        AiServiceType.INJURY_PREDICTION,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 2000
        }
      );

      // 3. Parsear resposta
      const analysis = this.parseAIResponse(response.content);

      logger.info('Injury risk analyzed', {
        riskLevel: analysis.riskLevel,
        potentialInjuries: analysis.potentialInjuries.length
      });

      return analysis;

    } catch (error) {
      logger.error('Error analyzing injury risk:', error);
      throw error;
    }
  }

  /**
   * Construir prompt para análise
   */
  private buildAnalysisPrompt(data: InjuryPreventionData): string {
    return `Você é um especialista em prevenção de lesões esportivas.

Analise o perfil do cliente e forneça uma análise completa de risco de lesões:

Demográficos:
- Idade: ${data.demographics.age}
- Gênero: ${data.demographics.gender}
- Nível de atividade: ${data.demographics.activityLevel}

Histórico de treinos: ${data.workoutHistory ? 'Disponível' : 'Não disponível'}
Sintomas atuais: ${data.currentSymptoms?.join(', ') || 'Nenhum'}

Programa atual: ${data.currentProgram ? 'Definido' : 'Não definido'}

Forneça análise em JSON:
{
  "riskLevel": "low/medium/high/very-high",
  "potentialInjuries": [
    {
      "name": "nome",
      "probability": 0.0-1.0,
      "preventionTips": ["dica1", "dica2"]
    }
  ],
  "recommendations": ["rec1", "rec2"],
  "modifications": [
    {
      "exercise": "exercicio",
      "modification": "modificacao",
      "reason": "razao"
    }
  ]
}`;
  }

  /**
   * Parsear resposta da AI
   */
  private parseAIResponse(aiResponse: string): InjuryPreventionResult {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
      
      const parsed = JSON.parse(jsonText);
      
      return {
        riskLevel: parsed.riskLevel || 'medium',
        potentialInjuries: parsed.potentialInjuries || [],
        recommendations: parsed.recommendations || [],
        modifications: parsed.modifications || []
      };
      
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      
      return {
        riskLevel: 'medium',
        potentialInjuries: [],
        recommendations: ['Consulte um profissional especializado'],
        modifications: []
      };
    }
  }

  /**
   * Gerar alertas preventivos
   */
  async generatePreventiveAlerts(
    analysis: InjuryPreventionResult,
    thresholds: { low: number; medium: number; high: number }
  ): Promise<Array<{ type: 'warning' | 'alert' | 'danger'; message: string }>> {
    const alerts: Array<{ type: 'warning' | 'alert' | 'danger'; message: string }> = [];

    // Analisar nível de risco
    if (analysis.riskLevel === 'very-high') {
      alerts.push({
        type: 'danger',
        message: 'Alto risco de lesão detectado! Pause o treino e consulte um médico.'
      });
    } else if (analysis.riskLevel === 'high') {
      alerts.push({
        type: 'alert',
        message: 'Risco de lesão elevado. Reduza intensidade e consulte profissional.'
      });
    }

    // Analisar probabilidade de lesões específicas
    analysis.potentialInjuries.forEach(injury => {
      if (injury.probability > thresholds.high) {
        alerts.push({
          type: 'alert',
          message: `Risco de ${injury.name}: ${(injury.probability * 100).toFixed(0)}%`
        });
      }
    });

    return alerts;
  }
}

export default new InjuryPreventionAgent();

