/**
 * Ad Relevance Agent - FitOS Monetization System
 * 
 * Agente de IA especializado em calcular relevância de anúncios
 * baseado no contexto do usuário, histórico de interações e 
 * características do anúncio.
 */

import { Advertisement } from '@prisma/client';
import { AiClientFactory } from '../services/ai-client.factory';
import { AiServiceType } from '../../../shared/types/ai.types';
import { RedisService } from '../services/redis.service';
import { logger } from '../utils/logger';

export interface AdRelevanceContext {
  // Contexto do usuário
  userId?: string;
  currentGoal?: 'gain_muscle' | 'lose_weight' | 'maintain' | 'performance';
  recentActivities?: string[];
  nutritionPreferences?: string[];
  equipmentAvailable?: string[];
  budget?: 'low' | 'medium' | 'high';
  interests?: string[];
  plan?: string;
  tenantType?: string;
  
  // Contexto da página/sessão
  position?: string;
  pageContext?: string;
  
  // Histórico de interações (opcional)
  previousAdInteractions?: Array<{
    adId: string;
    type: 'view' | 'click' | 'conversion';
    timestamp: Date;
    relevance?: number;
  }>;
}

export interface AdRelevanceRequest {
  ad: Advertisement;
  userContext: AdRelevanceContext;
  tenantId: string;
}

export interface AdRelevanceResponse {
  relevanceScore: number; // 0.0 a 1.0
  confidence: number; // 0.0 a 1.0
  reasoning?: string; // Explicação da relevância (opcional)
  factors: {
    goalMatch?: number;
    interestMatch?: number;
    contextMatch?: number;
    targetingMatch?: number;
    historicalPerformance?: number;
  };
}

export class AdRelevanceAgent {
  private aiFactory: AiClientFactory;
  private redis: RedisService;

  constructor() {
    this.aiFactory = new AiClientFactory();
    this.redis = new RedisService();
  }

  /**
   * Calcula relevância de um anúncio usando IA
   * Combina análise de IA com regras de negócio para score final
   */
  async calculateRelevance(
    request: AdRelevanceRequest
  ): Promise<AdRelevanceResponse> {
    try {
      const { ad, userContext, tenantId } = request;

      // 1. Verificar cache primeiro
      const cacheKey = this.generateCacheKey(ad.id, userContext);
      const cached = await this.redis.get(cacheKey, {
        namespace: 'ad-relevance',
        ttl: 300 // Cache de 5 minutos
      });

      if (cached) {
        logger.debug('Ad relevance cache HIT', { adId: ad.id, userId: userContext.userId });
        return cached;
      }

      // 2. Cálculo base (regras de negócio simples)
      const baseScore = this.calculateBaseScore(ad, userContext);

      // 3. Tentar usar IA para refinamento (se configurado)
      let aiScore: number | null = null;
      let aiReasoning: string | undefined;
      
      try {
        const aiResult = await this.calculateWithAI(ad, userContext, tenantId);
        aiScore = aiResult.score;
        aiReasoning = aiResult.reasoning;
      } catch (error) {
        logger.warn('AI relevance calculation failed, using base score', {
          error: error instanceof Error ? error.message : 'Unknown error',
          adId: ad.id
        });
        // Continuar com score base se IA falhar
      }

      // 4. Combinar scores (70% IA, 30% base, ou 100% base se IA falhar)
      const finalScore = aiScore !== null 
        ? (aiScore * 0.7 + baseScore * 0.3)
        : baseScore;

      // 5. Aplicar fatores adicionais
      const factors = this.calculateFactors(ad, userContext);
      
      // Ajustar score final baseado nos fatores
      let adjustedScore = finalScore;
      if (factors.goalMatch !== undefined) adjustedScore *= (0.9 + factors.goalMatch * 0.1);
      if (factors.interestMatch !== undefined) adjustedScore *= (0.85 + factors.interestMatch * 0.15);
      if (factors.contextMatch !== undefined) adjustedScore *= (0.9 + factors.contextMatch * 0.1);
      if (factors.targetingMatch !== undefined) adjustedScore *= (0.8 + factors.targetingMatch * 0.2);

      // Cap entre 0 e 1
      adjustedScore = Math.max(0, Math.min(1, adjustedScore));

      // 6. Calcular confiança
      const confidence = aiScore !== null ? 0.9 : 0.7;

      const result: AdRelevanceResponse = {
        relevanceScore: adjustedScore,
        confidence,
        reasoning: aiReasoning,
        factors
      };

      // 7. Cachear resultado
      await this.redis.set(cacheKey, result, {
        namespace: 'ad-relevance',
        ttl: 300
      });

      logger.info('Ad relevance calculated', {
        adId: ad.id,
        score: adjustedScore,
        confidence,
        usedAI: aiScore !== null
      });

      return result;
    } catch (error) {
      logger.error('Error calculating ad relevance:', error);
      
      // Retornar score mínimo em caso de erro
      return {
        relevanceScore: 0.1,
        confidence: 0.0,
        factors: {}
      };
    }
  }

  /**
   * Cálculo base usando regras de negócio simples
   */
  private calculateBaseScore(
    ad: Advertisement,
    context: AdRelevanceContext
  ): number {
    let score = 0.5; // Score base

    const targeting = (ad.targeting as any) || {};

    // Match de objetivos
    if (targeting.goals && context.currentGoal) {
      if (targeting.goals.includes(context.currentGoal)) {
        score += 0.25;
      }
    }

    // Match de preferências nutricionais
    if (targeting.nutritionPreferences && context.nutritionPreferences) {
      const matchCount = context.nutritionPreferences.filter(pref =>
        targeting.nutritionPreferences.includes(pref)
      ).length;
      if (matchCount > 0) {
        score += Math.min(matchCount * 0.1, 0.15);
      }
    }

    // Match de interesses
    if (targeting.interests && context.interests) {
      const matchCount = context.interests.filter(interest =>
        targeting.interests.includes(interest)
      ).length;
      if (matchCount > 0) {
        score += Math.min(matchCount * 0.08, 0.12);
      }
    }

    // Match de plano
    if (targeting.plans && context.plan) {
      if (targeting.plans.includes(context.plan)) {
        score += 0.15;
      }
    }

    // Boost por prioridade do anúncio
    if (ad.priority > 0) {
      score += Math.min(ad.priority / 100, 0.1);
    }

    // Boost por performance histórica
    if (ad.avgRelevanceScore > 0) {
      score += Math.min(ad.avgRelevanceScore * 0.2, 0.1);
    }

    return Math.min(score, 1.0);
  }

  /**
   * Usar IA para cálculo refinado de relevância
   */
  private async calculateWithAI(
    ad: Advertisement,
    context: AdRelevanceContext,
    tenantId: string
  ): Promise<{ score: number; reasoning?: string }> {
    try {
      // Construir prompt para IA
      const prompt = this.buildRelevancePrompt(ad, context);

      // Chamar IA via AiClientFactory
      const response = await this.aiFactory.complete(
        AiServiceType.ANALYTICS, // Usar tipo ANALYTICS para análise de relevância
        {
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise de relevância de anúncios. Analise a relevância de um anúncio para um usuário específico e retorne um score entre 0 e 1, junto com uma breve explicação. Retorne JSON com {score: number, reasoning: string}.'
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        },
        {
          temperature: 0.3, // Baixa temperatura para respostas mais consistentes
          maxTokens: 200,
          metadata: {
            tenantId,
            service: 'ad-relevance',
            adId: ad.id
          }
        }
      );

      // Parsear resposta
      const content = response.content.trim();
      
      // Tentar extrair JSON da resposta
      let result: { score: number; reasoning?: string };
      
      try {
        // Tentar parse direto
        result = JSON.parse(content);
      } catch {
        // Se falhar, tentar extrair JSON do texto
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // Se não encontrar JSON, tentar extrair apenas o número
          const scoreMatch = content.match(/["']?score["']?\s*:\s*(\d*\.?\d+)/i) || 
                           content.match(/(\d*\.?\d+)/);
          const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.5;
          result = { score: Math.max(0, Math.min(1, score)) };
        }
      }

      // Validar score
      if (typeof result.score !== 'number' || isNaN(result.score)) {
        result.score = 0.5;
      }
      result.score = Math.max(0, Math.min(1, result.score));

      return result;
    } catch (error) {
      logger.error('Error in AI relevance calculation:', error);
      throw error;
    }
  }

  /**
   * Construir prompt para análise de relevância
   */
  private buildRelevancePrompt(
    ad: Advertisement,
    context: AdRelevanceContext
  ): string {
    const adInfo = {
      title: ad.title,
      description: ad.description,
      type: ad.type,
      position: ad.position,
      targeting: ad.targeting
    };

    const userInfo = {
      goal: context.currentGoal,
      interests: context.interests,
      nutritionPreferences: context.nutritionPreferences,
      equipment: context.equipmentAvailable,
      budget: context.budget,
      plan: context.plan,
      pageContext: context.pageContext
    };

    return `
Analise a relevância deste anúncio para o usuário:

ANÚNCIO:
${JSON.stringify(adInfo, null, 2)}

CONTEXTO DO USUÁRIO:
${JSON.stringify(userInfo, null, 2)}

Calcule um score de relevância entre 0.0 e 1.0 considerando:
- Quão bem o anúncio se alinha com os objetivos do usuário
- Se o anúncio corresponde aos interesses e preferências do usuário
- Se o contexto da página/posição é apropriado
- A qualidade do targeting do anúncio

Retorne JSON com formato:
{
  "score": 0.85,
  "reasoning": "Breve explicação da relevância"
}
`;
  }

  /**
   * Calcular fatores individuais de relevância
   */
  private calculateFactors(
    ad: Advertisement,
    context: AdRelevanceContext
  ): AdRelevanceResponse['factors'] {
    const targeting = (ad.targeting as any) || {};
    const factors: AdRelevanceResponse['factors'] = {};

    // Goal match
    if (targeting.goals && context.currentGoal) {
      factors.goalMatch = targeting.goals.includes(context.currentGoal) ? 1.0 : 0.0;
    }

    // Interest match
    if (targeting.interests && context.interests && context.interests.length > 0) {
      const matches = context.interests.filter(interest =>
        targeting.interests.includes(interest)
      ).length;
      factors.interestMatch = matches / context.interests.length;
    }

    // Context match (posição e página)
    if (ad.position && context.position) {
      factors.contextMatch = ad.position === context.position ? 1.0 : 0.5;
    }

    // Targeting match (plano, tipo de tenant)
    if (targeting.plans && context.plan) {
      factors.targetingMatch = targeting.plans.includes(context.plan) ? 1.0 : 0.0;
    } else if (targeting.tenantTypes && context.tenantType) {
      factors.targetingMatch = targeting.tenantTypes.includes(context.tenantType) ? 1.0 : 0.0;
    }

    // Historical performance
    if (ad.avgRelevanceScore > 0) {
      factors.historicalPerformance = Math.min(ad.avgRelevanceScore, 1.0);
    }

    return factors;
  }

  /**
   * Gerar chave de cache
   */
  private generateCacheKey(adId: string, context: AdRelevanceContext): string {
    const contextHash = JSON.stringify({
      userId: context.userId,
      goal: context.currentGoal,
      plan: context.plan,
      position: context.position
    });
    
    // Hash simples do contexto (pode ser melhorado)
    const hash = Buffer.from(contextHash).toString('base64').substring(0, 16);
    return `ad:${adId}:${hash}`;
  }
}
