/**
 * Laboratory Exam Interpretation Service - Sprint 7
 * Interpretação de exames laboratoriais usando AI Provider configurável
 */

import { logger } from '../../utils/logger';
import { AiClientFactory } from '../ai-client.factory';
import { AiServiceType } from '@/shared/types/ai.types';

export interface LabExamData {
  examType: string;
  results: Record<string, any>;
  referenceValues?: Record<string, { min: number; max: number }>;
}

export interface ExamInterpretation {
  summary: string;
  abnormalities: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  insights: string[];
}

export class LabExamInterpretationService {
  private aiClientFactory: AiClientFactory;

  constructor() {
    this.aiClientFactory = new AiClientFactory();
  }

  /**
   * Interpretar exame laboratorial usando AI Provider configurável
   */
  async interpretExam(data: LabExamData): Promise<ExamInterpretation> {
    try {
      // 1. Preparar prompt para AI
      const prompt = this.buildInterpretationPrompt(data);

      // 2. Chamar AI Provider configurável (escolhido pelo super admin)
      const response = await this.aiClientFactory.complete(
        AiServiceType.NUTRITION,
        prompt,
        {
          temperature: 0.7,
          maxTokens: 2000
        }
      );

      // 3. Parsear resposta
      const interpretation = this.parseAIResponse(response);

      logger.info('Lab exam interpreted successfully', {
        examType: data.examType,
        riskLevel: interpretation.riskLevel
      });

      return interpretation;

    } catch (error) {
      logger.error('Error interpreting lab exam:', error);
      throw error;
    }
  }

  /**
   * Construir prompt para interpretação
   */
  private buildInterpretationPrompt(data: LabExamData): string {
    const resultsText = Object.entries(data.results)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const referenceText = data.referenceValues
      ? `\nValores de referência:\n${Object.entries(data.referenceValues)
          .map(([key, ref]) => `${key}: ${ref.min} - ${ref.max}`)
          .join('\n')}`
      : '';

    return `Você é um nutricionista especializado em interpretação de exames laboratoriais.

Exame: ${data.examType}
Resultados:
${resultsText}
${referenceText}

Analise:
1. Resuma os achados principais
2. Identifique anomalias e valores fora da referência
3. Sugira recomendações nutricionais específicas
4. Avalie o nível de risco (low/medium/high/critical)
5. Forneça insights profissionais

Formato de resposta JSON:
{
  "summary": "resumo",
  "abnormalities": ["anomalia1", "anomalia2"],
  "recommendations": ["rec1", "rec2"],
  "riskLevel": "low/medium/high/critical",
  "insights": ["insight1", "insight2"]
}`;
  }

  /**
   * Parsear resposta da AI
   */
  private parseAIResponse(aiResponse: string): ExamInterpretation {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : aiResponse;
      
      const parsed = JSON.parse(jsonText);
      
      return {
        summary: parsed.summary || 'Análise não disponível',
        abnormalities: parsed.abnormalities || [],
        recommendations: parsed.recommendations || [],
        riskLevel: parsed.riskLevel || 'medium',
        insights: parsed.insights || []
      };
      
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      
      // Fallback
      return {
        summary: aiResponse || 'Análise realizada com sucesso',
        abnormalities: [],
        recommendations: [],
        riskLevel: 'medium',
        insights: ['Interprete os resultados com cautela']
      };
    }
  }

  /**
   * Interpretação em lote (múltiplos exames)
   */
  async interpretMultipleExams(exams: LabExamData[]): Promise<ExamInterpretation[]> {
    const interpretations = await Promise.all(
      exams.map(exam => this.interpretExam(exam))
    );
    
    return interpretations;
  }
}

export default new LabExamInterpretationService();

