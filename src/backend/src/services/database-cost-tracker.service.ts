/**
 * DatabaseCostTrackerService - Rastreamento de Custos de Database e Cache
 * 
 * Integra com APIs de provedores de cloud para:
 * - Buscar custos mensais de PostgreSQL/MySQL
 * - Buscar custos mensais de Redis/Cache
 * - Registrar custos no CostEntry
 * - Fallback para entrada manual se API não disponível
 */

import { CostTrackerService } from './cost-tracker.service';
import { logger } from '../utils/logger';
import { getPrismaClient } from '../config/database';

const prisma = getPrismaClient();

export interface DatabaseUsageData {
  provider: 'aws' | 'digitalocean' | 'railway' | 'manual';
  databaseType: 'postgresql' | 'mysql' | 'redis';
  sizeGB: number;
  instanceType?: string;
  metadata?: any;
}

export class DatabaseCostTrackerService {
  private costTracker: CostTrackerService;

  constructor() {
    this.costTracker = new CostTrackerService();
  }

  /**
   * Buscar custos da API do provedor (AWS, DigitalOcean, etc)
   */
  async fetchProviderCosts(
    provider: 'aws' | 'digitalocean' | 'railway',
    databaseType: 'postgresql' | 'mysql' | 'redis'
  ): Promise<{ cost: number; usageGB: number; metadata?: any } | null> {
    try {
      switch (provider) {
        case 'aws':
          return await this.fetchAWSCosts(databaseType);
        case 'digitalocean':
          return await this.fetchDigitalOceanCosts(databaseType);
        case 'railway':
          return await this.fetchRailwayCosts(databaseType);
        default:
          logger.warn(`Provider ${provider} not supported for automatic cost fetching`);
          return null;
      }
    } catch (error) {
      logger.error(`Error fetching costs from ${provider}:`, error);
      return null;
    }
  }

  /**
   * Buscar custos do AWS RDS/ElastiCache
   * Requer configuração: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
   */
  private async fetchAWSCosts(
    databaseType: 'postgresql' | 'mysql' | 'redis'
  ): Promise<{ cost: number; usageGB: number; metadata?: any } | null> {
    // TODO: Implementar integração com AWS Cost Explorer API
    // Por enquanto, retorna null (requer AWS SDK e configuração)
    logger.info(`AWS cost fetching for ${databaseType} not yet implemented`);
    return null;
  }

  /**
   * Buscar custos do DigitalOcean Managed Databases
   * Requer configuração: DIGITALOCEAN_API_TOKEN
   */
  private async fetchDigitalOceanCosts(
    databaseType: 'postgresql' | 'mysql' | 'redis'
  ): Promise<{ cost: number; usageGB: number; metadata?: any } | null> {
    const apiToken = process.env.DIGITALOCEAN_API_TOKEN;
    if (!apiToken) {
      logger.warn('DIGITALOCEAN_API_TOKEN not configured');
      return null;
    }

    try {
      // TODO: Implementar integração com DigitalOcean API
      // Exemplo de endpoint: GET https://api.digitalocean.com/v2/databases/{id}
      // Por enquanto, retorna null
      logger.info(`DigitalOcean cost fetching for ${databaseType} not yet implemented`);
      return null;
    } catch (error) {
      logger.error('Error fetching DigitalOcean costs:', error);
      return null;
    }
  }

  /**
   * Buscar custos do Railway
   * Railway não tem API pública de custos, usar estimativa baseada em uso
   */
  private async fetchRailwayCosts(
    databaseType: 'postgresql' | 'mysql' | 'redis'
  ): Promise<{ cost: number; usageGB: number; metadata?: any } | null> {
    // Railway não fornece API de custos, usar estimativa
    // Preços aproximados: $5/mês base + $0.01/GB storage
    const baseCost = 5.0;
    const costPerGB = 0.01;

    // Estimar uso baseado em tamanho do banco
    // TODO: Buscar tamanho real do banco via query
    const estimatedSizeGB = await this.estimateDatabaseSize(databaseType);

    const cost = baseCost + estimatedSizeGB * costPerGB;

    return {
      cost,
      usageGB: estimatedSizeGB,
      metadata: {
        provider: 'railway',
        estimated: true,
        baseCost,
        costPerGB,
      },
    };
  }

  /**
   * Estimar tamanho do banco de dados via query
   */
  private async estimateDatabaseSize(
    databaseType: 'postgresql' | 'mysql' | 'redis'
  ): Promise<number> {
    try {
      if (databaseType === 'postgresql') {
        // Query PostgreSQL para tamanho do banco
        const result = await prisma.$queryRaw<Array<{ size_bytes: bigint }>>`
          SELECT pg_database_size(current_database()) as size_bytes
        `;

        if (result && result[0]) {
          const sizeBytes = Number(result[0].size_bytes);
          return sizeBytes / (1024 * 1024 * 1024); // Converter para GB
        }
      } else if (databaseType === 'redis') {
        // Redis: usar estimativa baseada em configuração ou retornar 0
        // TODO: Integrar com Redis INFO para obter tamanho real
        return parseFloat(process.env.REDIS_ESTIMATED_SIZE_GB || '0.5');
      }

      return 0;
    } catch (error) {
      logger.error(`Error estimating ${databaseType} size:`, error);
      return 0;
    }
  }

  /**
   * Sincronizar custos mensais de database
   * Deve ser executado via job mensal
   */
  async syncMonthlyDatabaseCosts(): Promise<void> {
    try {
      logger.info('Starting monthly database costs sync');

      const provider = (process.env.DATABASE_PROVIDER || 'railway') as 'aws' | 'digitalocean' | 'railway';
      const databaseType = (process.env.DATABASE_TYPE || 'postgresql') as 'postgresql' | 'mysql' | 'redis';

      // Tentar buscar custos da API do provedor
      let costData = await this.fetchProviderCosts(provider, databaseType);

      // Se não conseguir da API, usar estimativa
      if (!costData) {
        logger.info(`No API data available, using estimation for ${provider} ${databaseType}`);
        costData = await this.estimateDatabaseCosts(provider, databaseType);
      }

      if (!costData || costData.cost <= 0) {
        logger.debug('No database costs to sync (cost is zero or negative)');
        return;
      }

      // Registrar entrada mensal
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      await this.costTracker.trackUsageWithCost({
        categoryName: 'database',
        serviceName: databaseType === 'redis' ? 'redis' : 'postgresql',
        cost: costData.cost,
        currency: process.env.COST_DEFAULT_CURRENCY || 'BRL',
        usage: {
          quantity: 1,
          unit: 'monthly_sync',
          metadata: {
            month,
            year,
            provider,
            databaseType,
            sizeGB: costData.usageGB,
            ...costData.metadata,
          },
        },
      });

      logger.info(
        `Monthly database costs synced: ${costData.cost.toFixed(2)} for ${month}/${year} (${provider} ${databaseType})`
      );
    } catch (error) {
      logger.error('Error syncing monthly database costs:', error);
      throw error;
    }
  }

  /**
   * Estimar custos quando API não está disponível
   */
  private async estimateDatabaseCosts(
    provider: string,
    databaseType: 'postgresql' | 'mysql' | 'redis'
  ): Promise<{ cost: number; usageGB: number; metadata?: any }> {
    const sizeGB = await this.estimateDatabaseSize(databaseType);

    // Preços estimados por GB/mês por provedor
    const costPerGBMap: Record<string, number> = {
      aws: 0.115, // RDS PostgreSQL
      digitalocean: 0.05,
      railway: 0.01,
      manual: parseFloat(process.env.COST_DATABASE_PER_GB || '0.10'),
    };

    const baseCostMap: Record<string, number> = {
      aws: 15.0,
      digitalocean: 12.0,
      railway: 5.0,
      manual: 0,
    };

    const costPerGB = costPerGBMap[provider] || costPerGBMap.manual;
    const baseCost = baseCostMap[provider] || 0;

    const cost = baseCost + sizeGB * costPerGB;

    return {
      cost,
      usageGB: sizeGB,
      metadata: {
        provider,
        estimated: true,
        baseCost,
        costPerGB,
      },
    };
  }

  /**
   * Registrar custo manual (fallback quando API não disponível)
   */
  async recordManualCost(data: {
    cost: number;
    usageGB: number;
    databaseType: 'postgresql' | 'mysql' | 'redis';
    month: number;
    year: number;
    metadata?: any;
  }): Promise<void> {
    try {
      const { cost, usageGB, databaseType, month, year, metadata } = data;

      if (cost <= 0) {
        logger.warn('Manual cost entry has zero or negative cost, skipping');
        return;
      }

      await this.costTracker.trackUsageWithCost({
        categoryName: 'database',
        serviceName: databaseType === 'redis' ? 'redis' : 'postgresql',
        cost,
        currency: process.env.COST_DEFAULT_CURRENCY || 'BRL',
        usage: {
          quantity: 1,
          unit: 'manual_entry',
          metadata: {
            month,
            year,
            provider: 'manual',
            databaseType,
            sizeGB: usageGB,
            ...metadata,
          },
        },
      });

      logger.info(`Manual database cost recorded: ${cost.toFixed(2)} for ${month}/${year}`);
    } catch (error) {
      logger.error('Error recording manual database cost:', error);
      throw error;
    }
  }
}
