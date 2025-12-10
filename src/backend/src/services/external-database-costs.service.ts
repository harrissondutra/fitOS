/**
 * External Database Costs Service
 * Busca custos de bancos de dados dos provedores externos via API
 */

import { logger } from '../utils/logger';
import { EncryptionService } from './encryption.service';
import { getPrismaClient } from '../config/database';
import { costTrackerService } from './cost-tracker.service';
import { DatabaseProvider } from '@prisma/client';

export interface ProviderCostData {
  provider: string;
  totalCost: number;
  currency: string;
  period: string; // 'current_month', 'last_month', etc
  databases: Array<{
    id: string;
    name: string;
    cost: number;
    usage?: {
      storage?: number; // GB
      compute?: number; // hours
      requests?: number;
    };
  }>;
  metadata?: Record<string, any>;
}

export interface ProviderAuth {
  provider: string;
  authType: 'api_key' | 'oauth' | 'service_role';
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export class ExternalDatabaseCostsService {
  private encryptionService: EncryptionService;
  private prisma = getPrismaClient();

  constructor() {
    this.encryptionService = new EncryptionService();
    logger.info('ExternalDatabaseCostsService initialized');
  }

  /**
   * Busca custos do Railway
   * Railway API não expõe billing diretamente, então estimamos baseado em uso
   */
  async getRailwayCosts(auth: ProviderAuth): Promise<ProviderCostData | null> {
    try {
      if (!auth.token) {
        throw new Error('Railway API token is required');
      }

      // Railway não tem API pública de billing, mas podemos estimar baseado em uso
      // Por enquanto, retornamos null indicando que não há dados disponíveis
      logger.warn('Railway does not provide billing API. Costs estimation not implemented.');
      return null;
    } catch (error) {
      logger.error('Error fetching Railway costs:', error);
      return null;
    }
  }

  /**
   * Busca custos do Supabase
   * Supabase Management API pode fornecer informações de uso
   */
  async getSupabaseCosts(auth: ProviderAuth): Promise<ProviderCostData | null> {
    try {
      if (!auth.token) {
        throw new Error('Supabase API key is required');
      }

      // Supabase Management API - informações de projeto
      const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!projectsResponse.ok) {
        logger.warn('Supabase API does not provide billing data via Management API');
        return null;
      }

      const projects = await projectsResponse.json();
      
      // Supabase não expõe billing diretamente na API pública
      // Os custos são gerenciados através do dashboard
      logger.warn('Supabase billing not available via API. Manual entry recommended.');
      return null;
    } catch (error) {
      logger.error('Error fetching Supabase costs:', error);
      return null;
    }
  }

  /**
   * Busca custos do Neon
   * Neon API pode fornecer métricas de uso
   */
  async getNeonCosts(auth: ProviderAuth): Promise<ProviderCostData | null> {
    try {
      if (!auth.token) {
        throw new Error('Neon API key is required');
      }

      // Neon API v2 - listar projetos
      const projectsResponse = await fetch('https://console.neon.tech/api/v2/projects', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!projectsResponse.ok) {
        logger.warn('Neon API error fetching projects');
        return null;
      }

      const projectsData = await projectsResponse.json();
      
      // Neon não expõe billing diretamente na API pública
      // Estimativas baseadas em uso podem ser implementadas
      logger.warn('Neon billing not available via API. Manual entry recommended.');
      return null;
    } catch (error) {
      logger.error('Error fetching Neon costs:', error);
      return null;
    }
  }

  /**
   * Busca custos do Aiven
   * Aiven API tem endpoints de billing
   */
  async getAivenCosts(auth: ProviderAuth): Promise<ProviderCostData | null> {
    try {
      if (!auth.token) {
        throw new Error('Aiven API token is required');
      }

      // Aiven API - billing endpoint (requer permissões especiais)
      // GET /v1/billing/projects/{project}/invoice_items
      // Por enquanto, retornamos null pois requer projeto específico
      logger.warn('Aiven billing API requires project-specific calls. Not implemented yet.');
      return null;
    } catch (error) {
      logger.error('Error fetching Aiven costs:', error);
      return null;
    }
  }

  /**
   * Busca custos do Render
   * Render API pode fornecer informações de uso
   */
  async getRenderCosts(auth: ProviderAuth): Promise<ProviderCostData | null> {
    try {
      if (!auth.token) {
        throw new Error('Render API key is required');
      }

      // Render API - serviços
      const servicesResponse = await fetch('https://api.render.com/v1/services', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!servicesResponse.ok) {
        logger.warn('Render API error fetching services');
        return null;
      }

      const services = await servicesResponse.json();
      const databases = services.filter((s: any) => s.type === 'postgresql' || s.type === 'redis');
      
      // Render não expõe billing diretamente na API
      // Estimativas podem ser calculadas baseadas em plano e uso
      logger.warn('Render billing not available via API. Manual entry recommended.');
      return null;
    } catch (error) {
      logger.error('Error fetching Render costs:', error);
      return null;
    }
  }

  /**
   * Busca custos do Upstash
   * Upstash API fornece métricas de uso e pode ter informações de billing
   */
  async getUpstashCosts(auth: ProviderAuth): Promise<ProviderCostData | null> {
    try {
      if (!auth.token) {
        throw new Error('Upstash API key is required');
      }

      // Upstash API v2 - listar databases
      const databasesResponse = await fetch('https://api.upstash.com/v2/redis/databases', {
        headers: {
          'Authorization': `Bearer ${auth.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!databasesResponse.ok) {
        logger.warn('Upstash API error fetching databases');
        return null;
      }

      const databasesData = await databasesResponse.json();
      const databases = databasesData.result || [];

      // Upstash pode ter informações de uso, mas billing geralmente é via dashboard
      // Por enquanto, retornamos estrutura vazia indicando que precisa entrada manual
      logger.warn('Upstash billing details not available via API. Manual entry recommended.');
      return null;
    } catch (error) {
      logger.error('Error fetching Upstash costs:', error);
      return null;
    }
  }

  /**
   * Busca custos de todos os provedores configurados
   */
  async getAllProviderCosts(userId: string): Promise<ProviderCostData[]> {
    try {
      // Buscar todas as autenticações ativas do usuário
      const auths = await this.prisma.providerAuthentication.findMany({
        where: {
          userId,
          isActive: true
        }
      });

      const costs: ProviderCostData[] = [];

      for (const auth of auths) {
        try {
          // Descriptografar token
          const token = this.encryptionService.decrypt(auth.encryptedToken);
          
          const providerAuth: ProviderAuth = {
            provider: auth.provider,
            authType: auth.authType as any,
            token
          };

          // Buscar custos baseado no provedor
          let costData: ProviderCostData | null = null;

          switch (auth.provider.toLowerCase()) {
            case 'railway':
              costData = await this.getRailwayCosts(providerAuth);
              break;
            case 'supabase':
              costData = await this.getSupabaseCosts(providerAuth);
              break;
            case 'neon':
              costData = await this.getNeonCosts(providerAuth);
              break;
            case 'aiven':
              costData = await this.getAivenCosts(providerAuth);
              break;
            case 'render':
              costData = await this.getRenderCosts(providerAuth);
              break;
            case 'upstash':
              costData = await this.getUpstashCosts(providerAuth);
              break;
            default:
              logger.warn(`Provider ${auth.provider} not supported for costs`);
          }

          if (costData) {
            costs.push(costData);
          }
        } catch (error) {
          logger.error(`Error fetching costs for provider ${auth.provider}:`, error);
          // Continuar com outros provedores mesmo se um falhar
        }
      }

      return costs;
    } catch (error) {
      logger.error('Error fetching all provider costs:', error);
      throw error;
    }
  }

  /**
   * Registra custos no sistema de custos
   */
  async syncCostsToSystem(userId: string, costs: ProviderCostData[]): Promise<void> {
    try {
      for (const cost of costs) {
        for (const db of cost.databases) {
          // Buscar ou criar serviço de custo
          const category = await this.prisma.costCategory.findUnique({
            where: { name: 'database' }
          });

          if (!category) {
            logger.warn('Database cost category not found. Skipping cost sync.');
            continue;
          }

          // Buscar serviço ou criar
          let service = await this.prisma.costService.findFirst({
            where: {
              categoryId: category.id,
              name: `${cost.provider} - ${db.name}`
            }
          });

          if (!service) {
            // Criar serviço se não existir
            service = await this.prisma.costService.create({
              data: {
                categoryId: category.id,
                name: `${cost.provider} - ${db.name}`,
                displayName: `${cost.provider} - ${db.name}`,
                provider: cost.provider,
                pricingModel: { type: 'fixed', fixed: db.cost },
                apiConfig: {
                  databaseId: db.id,
                  description: `Database ${db.name} no provedor ${cost.provider}`
                }
              }
            });
          }

          // Registrar uso/custo usando o costTrackerService
          await costTrackerService.trackUsage({
            categoryName: 'database',
            serviceName: service.name,
            usage: {
              quantity: db.cost,
              unit: cost.currency,
              metadata: {
                provider: cost.provider,
                databaseId: db.id,
                period: cost.period,
                ...db.usage
              }
            },
            createdBy: userId
          });
        }
      }

      logger.info(`Synced ${costs.length} provider costs to system`);
    } catch (error) {
      logger.error('Error syncing costs to system:', error);
      throw error;
    }
  }
}

export const externalDatabaseCostsService = new ExternalDatabaseCostsService();

