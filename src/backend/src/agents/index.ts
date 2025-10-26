/**
 * AI Agents Index - FitOS Sprint 4
 * 
 * Exporta todos os agentes de IA para facilitar importação.
 */

// AI Agents
export { AINutritionAgent } from './ai-nutrition-agent';
export { CRMAnalyticsAgent } from './crm-analytics-agent';

// Agent Instances (singletons)
export { aiNutritionAgent } from './ai-nutrition-agent';
export { crmAnalyticsAgent } from './crm-analytics-agent';

// Types
export type {
  NutritionAnalysisRequest,
  NutritionAnalysisResponse
} from './ai-nutrition-agent';

export type {
  CRMAnalyticsRequest,
  CRMAnalyticsResponse
} from './crm-analytics-agent';
