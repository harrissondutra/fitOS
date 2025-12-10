/**
 * Advertisement Service
 * 
 * Serviço para gerenciamento de anúncios com:
 * - CRUD completo de anúncios
 * - Busca de anúncios relevantes com IA
 * - Sistema de tracking (impressões, cliques, conversões)
 * - Limites de frequência por usuário
 * - Cache Redis para performance
 */

import { PrismaClient, Advertisement } from '@prisma/client';
import { PrismaClient as PrismaClientType } from '@prisma/client';
import { RedisService } from './redis.service';
import { logger } from '../utils/logger';
import { AdRelevanceAgent, AdRelevanceContext } from '../agents/ad-relevance-agent';

export interface UserContext {
  currentGoal?: 'gain_muscle' | 'lose_weight' | 'maintain' | 'performance';     
  recentActivities?: string[];
  nutritionPreferences?: string[];
  equipmentAvailable?: string[];
  budget?: 'low' | 'medium' | 'high';
  interests?: string[];
  userId?: string;
  plan?: string;
  tenantType?: string;
  position?: string;
}

export interface CreateAdvertisementDto {
  tenantId: string;
  type: 'native' | 'contextual' | 'banner' | 'sponsored_content' | 'affiliate';
  position: 'feed' | 'sidebar' | 'exercise_list' | 'meal_plan' | 'email' | 'dashboard';
  title?: string;
  description?: string;
  imageUrl?: string;
  targetUrl?: string;
  adCode?: string;
  targeting?: {
    plans?: string[];
    goals?: string[];
    minRelevance?: number;
  };
  priority?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateAdvertisementDto extends Partial<CreateAdvertisementDto> {
  isActive?: boolean;
}

export interface AdvertisementStats {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  avgRelevanceScore: number;
}

export class AdvertisementService {
  private prisma: PrismaClientType;
  private redis: RedisService;
  private adRelevanceAgent: AdRelevanceAgent;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new RedisService();
    this.adRelevanceAgent = new AdRelevanceAgent();
  }

  /**
   * Criar novo anúncio
   */
  async createAdvertisement(data: CreateAdvertisementDto): Promise<Advertisement> {
    try {
      const advertisement = await this.prisma.advertisement.create({
        data: {
          tenantId: data.tenantId,
          type: data.type,
          position: data.position,
          title: data.title,
          description: data.description,
          imageUrl: data.imageUrl,
          targetUrl: data.targetUrl,
          adCode: data.adCode,
          targeting: data.targeting || {},
          priority: data.priority || 0,
          startDate: data.startDate,
          endDate: data.endDate,
          isActive: true
        }
      });

      // Invalidar cache
      await this.invalidateCache(data.tenantId);

      logger.info('Advertisement created', { 
        id: advertisement.id, 
        tenantId: data.tenantId,
        type: data.type,
        position: data.position
      });

      return advertisement;
    } catch (error) {
      logger.error('Error creating advertisement:', error);
      throw error;
    }
  }

  /**
   * Buscar anúncio mais relevante com IA
   */
  async getRelevantAd(
    position: string,
    userContext: UserContext,
    tenantId: string
  ): Promise<Advertisement | null> {
    try {
      // 1. Verificar se deve exibir anúncios
      const shouldShow = await this.shouldShowAds(tenantId);
      if (!shouldShow) {
        logger.debug('Ads disabled for tenant', { tenantId });
        return null;
      }

      // 2. Buscar anúncios candidatos
      const candidates = await this.getAdCandidates(position, tenantId);
      if (candidates.length === 0) {
        logger.debug('No ad candidates found', { position, tenantId });
        return null;
      }

      // 3. Filtrar por limites de frequência
      const availableAds = await this.filterByFrequencyLimit(candidates, userContext.userId || '');
      if (availableAds.length === 0) {
        logger.debug('No ads available (frequency limit)', { userId: userContext.userId });
        return null;
      }

      // 4. Calcular relevância com IA usando AdRelevanceAgent
      const scoredAds = await Promise.all(
        availableAds.map(async ad => ({
          ad,
          score: await this.calculateRelevance(ad, userContext, tenantId)
        }))
      );

      // 5. Filtrar por relevância mínima (80%)
      const MIN_RELEVANCE = 0.8;
      const relevant = scoredAds.filter(item => item.score >= MIN_RELEVANCE);
      
      if (relevant.length === 0) {
        logger.debug('No ads meet minimum relevance threshold', { 
          position, 
          tenantId,
          minRelevance: MIN_RELEVANCE
        });
        return null;
      }

      // 6. Retornar mais relevante (ordenado por score e priority)
      const best = relevant.sort((a, b) => {
        // Primeiro por score, depois por priority
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return (b.ad.priority || 0) - (a.ad.priority || 0);
      })[0];

      // 7. Registrar impressão
      await this.registerImpression(best.ad.id, tenantId, best.score, userContext.userId);

      return best.ad;
    } catch (error) {
      logger.error('Error getting relevant ad:', error);
      return null; // Fail silently para não quebrar UX
    }
  }

  /**
   * Buscar anúncios ativos por posição (método auxiliar para rotas)
   * Retorna múltiplos anúncios relevantes usando getRelevantAd internamente
   */
  async getActiveAdsByPosition(
    tenantId: string,
    position?: string,
    context?: string,
    limit: number = 3
  ): Promise<Advertisement[]> {
    try {
      const ads: Advertisement[] = [];
      const seenIds = new Set<string>();

      // Buscar até `limit` anúncios relevantes
      for (let i = 0; i < limit; i++) {
        const userContext: UserContext = {
          position: position,
          // Parse context JSON se fornecido
          ...(context && this.parseContext(context))
        };

        const ad = await this.getRelevantAd(
          position || 'header',
          userContext,
          tenantId
        );

        if (ad && !seenIds.has(ad.id)) {
          ads.push(ad);
          seenIds.add(ad.id);
        } else {
          // Não há mais anúncios únicos disponíveis
          break;
        }
      }

      return ads;
    } catch (error) {
      logger.error('Error getting active ads by position:', error);
      return [];
    }
  }

  /**
   * Parse contexto JSON de string
   */
  private parseContext(context: string): Partial<UserContext> {
    try {
      return JSON.parse(context);
    } catch {
      return {};
    }
  }

  /**
   * Verificar se deve exibir anúncios para o tenant
   */
  private async shouldShowAds(tenantId: string): Promise<boolean> {
    const cacheKey = `ads:should_show:${tenantId}`;
    
    try {
      const cached = await this.redis.get(cacheKey, {
        namespace: 'ads',
        ttl: 300 // 5 minutos
      });
      
      if (cached !== null) {
        return cached === true;
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { 
          adsEnabled: true, 
          plan: true,
          adsSettings: true
        }
      });

      if (!tenant) {
        return false;
      }

      // Verificar se adsEnabled está ativo
      const shouldShow = tenant.adsEnabled === true;

      // Cachear resultado
      await this.redis.set(cacheKey, shouldShow, {
        namespace: 'ads',
        ttl: 300
      });

      return shouldShow;
    } catch (error) {
      logger.error('Error checking if should show ads:', error);
      return false; // Fail safe: não mostrar anúncios se houver erro
    }
  }

  /**
   * Buscar anúncios candidatos para uma posição
   */
  private async getAdCandidates(position: string, tenantId: string): Promise<Advertisement[]> {
    const cacheKey = `ads:candidates:${tenantId}:${position}`;
    
    try {
      const cached = await this.redis.get(cacheKey, {
        namespace: 'ads',
        ttl: 60 // 1 minuto
      });
      
      if (cached) {
        return cached as Advertisement[];
      }

      const now = new Date();
      const ads = await this.prisma.advertisement.findMany({
        where: {
          tenantId,
          position,
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: now } }
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } }
              ]
            }
          ]
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: 20 // Limitar candidatos para performance
      });

      // Cachear
      await this.redis.set(cacheKey, ads, {
        namespace: 'ads',
        ttl: 60
      });

      return ads;
    } catch (error) {
      logger.error('Error getting ad candidates:', error);
      return [];
    }
  }

  /**
   * Filtrar anúncios por limites de frequência
   */
  private async filterByFrequencyLimit(
    ads: Advertisement[],
    userId: string
  ): Promise<Advertisement[]> {
    if (!userId) {
      return ads; // Se não tem userId, não pode aplicar limite de frequência
    }

    const today = new Date().toISOString().split('T')[0];
    const filtered: Advertisement[] = [];

    for (const ad of ads) {
      const frequencyKey = `ads:frequency:${userId}:${ad.id}:${today}`;
      
      try {
        const count = await this.redis.get(frequencyKey, {
          namespace: 'ads',
          serialize: false
        });

        const countNum = count ? parseInt(count as string) : 0;
        
        // Máximo 2x por dia
        if (countNum < 2) {
          filtered.push(ad);
        }
      } catch (error) {
        logger.warn('Error checking frequency limit:', error);
        // Em caso de erro, incluir o anúncio (fail open)
        filtered.push(ad);
      }
    }

    return filtered;
  }

  /**
   * Calcular relevância do anúncio para o contexto do usuário
   */
    private async calculateRelevance(
    ad: Advertisement,
    context: UserContext,
    tenantId?: string
  ): Promise<number> {
    try {
      // Usar AI Agent para cálculo de relevância
      const relevanceContext: AdRelevanceContext = {
        userId: context.userId,
        currentGoal: context.currentGoal,
        recentActivities: context.recentActivities,
        nutritionPreferences: context.nutritionPreferences,
        equipmentAvailable: context.equipmentAvailable,
        budget: context.budget,
        interests: context.interests,
        plan: context.plan,
        tenantType: context.tenantType,
        position: context.position
      };

      const relevanceResult = await this.adRelevanceAgent.calculateRelevance({
        ad,
        userContext: relevanceContext,
        tenantId: tenantId || ad.tenantId
      });

      logger.debug('Ad relevance calculated', {
        adId: ad.id,
        score: relevanceResult.relevanceScore,
        confidence: relevanceResult.confidence,
        factors: relevanceResult.factors
      });

      return relevanceResult.relevanceScore;
    } catch (error) {
      logger.error('Error calculating ad relevance with AI Agent, falling back to simple calculation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        adId: ad.id
      });

      // Fallback para cálculo simples se o AI Agent falhar
      return this.calculateSimpleRelevance(ad, context);
    }
  }

  /**
   * Cálculo simples de relevância (fallback)
   */
  private calculateSimpleRelevance(
    ad: Advertisement,
    context: UserContext
  ): number {
    let score = 0.5; // Score base

    const targeting = ad.targeting as any || {};

    // Verificar se objetivo do usuário corresponde ao targeting
    if (targeting.goals && context.currentGoal) {
      if (targeting.goals.includes(context.currentGoal)) {
        score += 0.3;
      }
    }

    // Verificar se há preferências nutricionais correspondentes
    if (targeting.nutritionPreferences && context.nutritionPreferences) {       
      const match = context.nutritionPreferences.some(pref =>
        targeting.nutritionPreferences.includes(pref)
      );
      if (match) {
        score += 0.2;
      }
    }

    // Boost por prioridade
    if (ad.priority > 0) {
      score += Math.min(ad.priority / 10, 0.1); // Max 0.1 boost
    }

    return Math.min(score, 1.0); // Cap em 1.0
  }

  /**
   * Registrar impressão de anúncio
   */
  async registerImpression(
    adId: string,
    tenantId: string,
    relevanceScore: number,
    userId?: string
  ): Promise<void> {
    try {
      // Atualizar contador no banco e média de relevância
      const ad = await this.prisma.advertisement.findUnique({
        where: { id: adId },
        select: { impressionCount: true, avgRelevanceScore: true }
      });

      if (ad) {
        // Calcular nova média ponderada
        const currentImpressions = ad.impressionCount;
        const currentAvg = ad.avgRelevanceScore || 0;
        const newImpressions = currentImpressions + 1;
        const newAvg = ((currentAvg * currentImpressions) + relevanceScore) / newImpressions;

        await this.prisma.advertisement.update({
          where: { id: adId },
          data: {
            impressionCount: { increment: 1 },
            avgRelevanceScore: newAvg
          }
        });
      }

      // Registrar no Redis para limite de frequência
      if (userId) {
        const today = new Date().toISOString().split('T')[0];
        const frequencyKey = `ads:frequency:${userId}:${adId}:${today}`;
        
        await this.redis.incrWithTTL(frequencyKey, 86400, {
          namespace: 'ads'
        }); // TTL de 24 horas
      }

      logger.debug('Advertisement impression registered', { 
        adId, 
        tenantId, 
        relevanceScore,
        userId
      });
    } catch (error) {
      logger.error('Error registering impression:', error);
      // Não lançar erro para não quebrar UX
    }
  }

  /**
   * Registrar clique em anúncio
   */
  async registerClick(adId: string, tenantId: string, userId?: string): Promise<void> {
    try {
      await this.prisma.advertisement.update({
        where: { id: adId },
        data: {
          clickCount: { increment: 1 }
        }
      });

      logger.info('Advertisement click registered', { adId, tenantId, userId });
    } catch (error) {
      logger.error('Error registering click:', error);
    }
  }

  /**
   * Registrar conversão (venda/lead)
   */
  async registerConversion(adId: string, tenantId: string, value?: number): Promise<void> {
    try {
      await this.prisma.advertisement.update({
        where: { id: adId },
        data: {
          conversionCount: { increment: 1 }
        }
      });

      logger.info('Advertisement conversion registered', { adId, tenantId, value });
    } catch (error) {
      logger.error('Error registering conversion:', error);
    }
  }

  /**
   * Obter estatísticas de um anúncio
   */
  async getAdvertisementStats(adId: string): Promise<AdvertisementStats> {
    const ad = await this.prisma.advertisement.findUnique({
      where: { id: adId },
      select: {
        impressionCount: true,
        clickCount: true,
        conversionCount: true,
        avgRelevanceScore: true
      }
    });

    if (!ad) {
      throw new Error('Advertisement not found');
    }

    const ctr = ad.impressionCount > 0 
      ? (ad.clickCount / ad.impressionCount) * 100 
      : 0;
    
    const conversionRate = ad.clickCount > 0
      ? (ad.conversionCount / ad.clickCount) * 100
      : 0;

    return {
      impressions: ad.impressionCount,
      clicks: ad.clickCount,
      conversions: ad.conversionCount,
      ctr,
      conversionRate,
      avgRelevanceScore: ad.avgRelevanceScore
    };
  }

  /**
   * Listar anúncios de um tenant
   */
  async listAdvertisements(
    tenantId: string,
    filters?: {
      type?: string;
      position?: string;
      isActive?: boolean;
    }
  ): Promise<Advertisement[]> {
    return await this.prisma.advertisement.findMany({
      where: {
        tenantId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.position && { position: filters.position }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive })
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Atualizar anúncio
   */
  async updateAdvertisement(
    adId: string,
    tenantId: string,
    data: UpdateAdvertisementDto
  ): Promise<Advertisement> {
    // Verificar se anúncio pertence ao tenant
    const existing = await this.prisma.advertisement.findFirst({
      where: { id: adId, tenantId }
    });

    if (!existing) {
      throw new Error('Advertisement not found');
    }

    const updated = await this.prisma.advertisement.update({
      where: { id: adId },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.position && { position: data.position }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.targetUrl !== undefined && { targetUrl: data.targetUrl }),
        ...(data.adCode !== undefined && { adCode: data.adCode }),
        ...(data.targeting && { targeting: data.targeting }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });

    // Invalidar cache
    await this.invalidateCache(tenantId);

    return updated;
  }

  /**
   * Deletar anúncio (soft delete)
   */
  async deleteAdvertisement(adId: string, tenantId: string): Promise<void> {
    const existing = await this.prisma.advertisement.findFirst({
      where: { id: adId, tenantId }
    });

    if (!existing) {
      throw new Error('Advertisement not found');
    }

    await this.prisma.advertisement.update({
      where: { id: adId },
      data: { isActive: false }
    });

    // Invalidar cache
    await this.invalidateCache(tenantId);
  }

  /**
   * Invalidar cache relacionado a anúncios
   */
  private async invalidateCache(tenantId: string): Promise<void> {
    try {
      // Invalidar cache específico
      await this.redis.del(`ads:should_show:${tenantId}`, {
        namespace: 'ads'
      });

      // Invalidar cache de candidatos por padrão
      await this.redis.invalidatePattern(`ads:candidates:${tenantId}:*`, {
        namespace: 'ads'
      });
    } catch (error) {
      logger.warn('Error invalidating cache:', error);
    }
  }
}
