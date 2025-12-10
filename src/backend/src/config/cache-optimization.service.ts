/**
 * Cache Optimization Service - Sprint 7
 * Cache agressivo com Redis para melhorar performance
 */

import { CacheService } from './redis.cache';
import { logger } from '../utils/logger';

export class CacheOptimizationService {
  private cacheService: CacheService;
  
  // TTLs otimizados para Sprint 7
  private readonly TTL = {
    // Dados nutricionais
    FOOD_SEARCH: 3600,           // 1 hora
    MEAL_PLANS: 1800,            // 30 minutos
    PRESCRIPTION_TEMPLATES: 7200, // 2 horas
    QUESTIONNAIRES: 7200,        // 2 horas
    
    // IA e análises
    AI_ANALYSIS: 86400,          // 24 horas
    BODY_SCAN_RESULTS: 86400,    // 24 horas
    EXAM_INTERPRETATION: 86400,  // 24 horas
    
    // Avaliações
    MATERNAL_ASSESSMENTS: 3600,  // 1 hora
    CHILD_ASSESSMENTS: 3600,     // 1 hora
    
    // Estatísticas e dashboards
    NUTRITION_STATS: 300,        // 5 minutos
    CLIENT_PROGRESS: 3600,       // 1 hora
    ADDON_FEATURES: 7200,        // 2 horas
  };

  constructor() {
    this.cacheService = new CacheService();
  }

  /**
   * Cache agressivo para busca de alimentos
   */
  async cacheFoodSearch(query: string, results: any[]) {
    const key = `search:${query.toLowerCase()}`;
    await this.cacheService.set('nutrition', key, results, this.TTL.FOOD_SEARCH);
    
    logger.info(`Food search cached`, { query, resultsCount: results.length });
  }

  /**
   * Obter busca de alimentos do cache
   */
  async getCachedFoodSearch(query: string): Promise<any[] | null> {
    const key = `search:${query.toLowerCase()}`;
    return await this.cacheService.get<any[]>('nutrition', key);
  }

  /**
   * Cache de templates de prescrições
   */
  async cachePrescriptionTemplates(filters: any, templates: any[]) {
    const key = `templates:${JSON.stringify(filters)}`;
    await this.cacheService.set('nutrition', key, templates, this.TTL.PRESCRIPTION_TEMPLATES);
  }

  /**
   * Obter templates do cache
   */
  async getCachedTemplates(filters: any): Promise<any[] | null> {
    const key = `templates:${JSON.stringify(filters)}`;
    return await this.cacheService.get<any[]>('nutrition', key);
  }

  /**
   * Cache de questionários
   */
  async cacheQuestionnaires(tenantId: string, questionnaires: any[]) {
    const key = `questionnaires:${tenantId}`;
    await this.cacheService.set('nutrition', key, questionnaires, this.TTL.QUESTIONNAIRES);
  }

  /**
   * Obter questionários do cache
   */
  async getCachedQuestionnaires(tenantId: string): Promise<any[] | null> {
    const key = `questionnaires:${tenantId}`;
    return await this.cacheService.get<any[]>('nutrition', key);
  }

  /**
   * Cache de análises de IA
   */
  async cacheAIAnalysis(analysisId: string, analysis: any) {
    const key = `ai_analysis:${analysisId}`;
    await this.cacheService.set('nutrition', key, analysis, this.TTL.AI_ANALYSIS);
  }

  /**
   * Obter análise IA do cache
   */
  async getCachedAIAnalysis(analysisId: string): Promise<any | null> {
    const key = `ai_analysis:${analysisId}`;
    return await this.cacheService.get('nutrition', key);
  }

  /**
   * Invalidar cache por namespace
   */
  async invalidateNamespace(namespace: string) {
    await this.cacheService.delByPattern('nutrition', `${namespace}:*`);
    logger.info(`Cache invalidated for namespace: ${namespace}`);
  }

  /**
   * Pre-aquecimento de cache
   */
  async warmupCache(tenantId: string) {
    logger.info('Starting cache warmup for Sprint 7', { tenantId });
    
    // Aquecer dados mais acessados
    // Templates, questionários, etc.
    
    logger.info('Cache warmup completed');
  }
}

export default new CacheOptimizationService();




