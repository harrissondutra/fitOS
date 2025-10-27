import { logger } from '../utils/logger';
import { cache } from '../config/redis';

interface AWSCostData {
  totalCost: number;
  currency: string;
  period: {
    start: string;
    end: string;
  };
  services: {
    service: string;
    cost: number;
    percentage: number;
  }[];
  lastUpdated: Date;
  cacheHit: boolean;
}

interface AWSUsageData {
  service: string;
  usage: number;
  unit: string;
  cost: number;
}

export class AWSCostTrackerService {
  private readonly CACHE_KEY: string;
  private readonly CACHE_TTL: number;
  private readonly ENABLED: boolean;
  private readonly ACCESS_KEY_ID: string;
  private readonly SECRET_ACCESS_KEY: string;
  private readonly REGION: string;

  constructor() {
    // Usar variáveis de ambiente (ZERO hardcode)
    const redisPrefix = process.env.REDIS_KEY_PREFIX || 'fitos:';
    this.CACHE_KEY = `${redisPrefix}costs:aws:usage:v1`;
    this.CACHE_TTL = parseInt(process.env.COST_CACHE_TTL_CLOUDINARY || process.env.COST_CACHE_TTL || '7200');
    this.ENABLED = process.env.AWS_COST_EXPLORER_ENABLED === 'true';
    this.ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
    this.SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
    this.REGION = process.env.AWS_REGION || 'us-east-1';
  }

  /**
   * Verifica se o serviço está habilitado
   */
  isEnabled(): boolean {
    return this.ENABLED;
  }

  /**
   * Obtém dados de custos do AWS com cache Redis
   */
  async getCostData(): Promise<AWSCostData | null> {
    if (!this.isEnabled()) {
      logger.info('AWS Cost Explorer is disabled, returning null');
      return null;
    }

    try {
      // 1. Tentar cache Redis primeiro
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        const cached = await cache.get(this.CACHE_KEY);
        if (cached) {
          logger.info('AWS cost data retrieved from cache');
          return {
            ...JSON.parse(cached),
            cacheHit: true,
            lastUpdated: new Date(),
          };
        }
      }

      // 2. Buscar dados reais da API do AWS Cost Explorer
      const costData = await this.fetchAWSCostData();
      
      // 3. Armazenar no cache Redis
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        await cache.set(this.CACHE_KEY, JSON.stringify(costData), this.CACHE_TTL);
        logger.info(`AWS cost data cached for ${this.CACHE_TTL} seconds`);
      }

      return costData;
    } catch (error) {
      logger.error('Failed to get AWS cost data:', error);
      throw new Error(`AWS cost tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Busca dados reais da API do AWS Cost Explorer
   * NOTA: Esta implementação é um placeholder - AWS Cost Explorer API é complexa
   */
  private async fetchAWSCostData(): Promise<AWSCostData> {
    // Verificar credenciais
    if (!this.ACCESS_KEY_ID || !this.SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured');
    }

    // TODO: Implementar integração real com AWS Cost Explorer API
    // Por enquanto, retornar dados mockados para desenvolvimento
    logger.warn('AWS Cost Explorer API not implemented yet, returning mock data');

    const mockData: AWSCostData = {
      totalCost: 0, // Sem custos reais por enquanto
      currency: 'USD',
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
      services: [
        {
          service: 'EC2',
          cost: 0,
          percentage: 0,
        },
        {
          service: 'S3',
          cost: 0,
          percentage: 0,
        },
        {
          service: 'RDS',
          cost: 0,
          percentage: 0,
        },
      ],
      lastUpdated: new Date(),
      cacheHit: false,
    };

    return mockData;
  }

  /**
   * Implementação real da AWS Cost Explorer API (para futuro)
   */
  private async fetchRealAWSCostData(): Promise<AWSCostData> {
    // Esta implementação seria usada quando quisermos integrar com AWS real
    // Requer AWS SDK e configuração adequada
    
    /*
    const AWS = require('aws-sdk');
    
    const costExplorer = new AWS.CostExplorer({
      region: this.REGION,
      accessKeyId: this.ACCESS_KEY_ID,
      secretAccessKey: this.SECRET_ACCESS_KEY,
    });

    const params = {
      TimePeriod: {
        Start: '2024-01-01',
        End: '2024-01-31',
      },
      Granularity: 'MONTHLY',
      Metrics: ['BlendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    };

    const result = await costExplorer.getCostAndUsage(params).promise();
    
    // Processar resultado e retornar AWSCostData
    */
    
    throw new Error('Real AWS Cost Explorer integration not implemented yet');
  }

  /**
   * Obtém dados de uso de serviços AWS
   */
  async getUsageData(): Promise<AWSUsageData[]> {
    if (!this.isEnabled()) {
      return [];
    }

    try {
      // TODO: Implementar quando tivermos integração real
      return [];
    } catch (error) {
      logger.error('Failed to get AWS usage data:', error);
      return [];
    }
  }

  /**
   * Obtém estatísticas para dashboard
   */
  async getDashboardStats(): Promise<{
    totalCost: number;
    costBreakdown: {
      ec2: number;
      s3: number;
      rds: number;
      other: number;
    };
    trends: {
      costChange: number;
      usageChange: number;
    };
  } | null> {
    if (!this.isEnabled()) {
      return null;
    }

    try {
      const costData = await this.getCostData();
      if (!costData) {
        return null;
      }

      const costBreakdown = {
        ec2: costData.services.find(s => s.service === 'EC2')?.cost || 0,
        s3: costData.services.find(s => s.service === 'S3')?.cost || 0,
        rds: costData.services.find(s => s.service === 'RDS')?.cost || 0,
        other: costData.services
          .filter(s => !['EC2', 'S3', 'RDS'].includes(s.service))
          .reduce((sum, s) => sum + s.cost, 0),
      };

      // TODO: Implementar comparação com mês anterior quando tivermos dados históricos
      const trends = {
        costChange: 0, // Placeholder
        usageChange: 0, // Placeholder
      };

      return {
        totalCost: costData.totalCost,
        costBreakdown,
        trends,
      };
    } catch (error) {
      logger.error('Failed to get AWS dashboard stats:', error);
      return null;
    }
  }

  /**
   * Verifica se os custos estão dentro dos limites
   */
  async checkCostLimits(threshold: number = 1000): Promise<{
    withinLimits: boolean;
    warnings: string[];
    critical: string[];
  }> {
    if (!this.isEnabled()) {
      return {
        withinLimits: true,
        warnings: [],
        critical: [],
      };
    }

    try {
      const costData = await this.getCostData();
      if (!costData) {
        return {
          withinLimits: true,
          warnings: [],
          critical: [],
        };
      }

      const warnings: string[] = [];
      const critical: string[] = [];

      if (costData.totalCost > threshold * 1.5) {
        critical.push(`Custos AWS acima de $${threshold * 1.5}: $${costData.totalCost.toFixed(2)}`);
      } else if (costData.totalCost > threshold) {
        warnings.push(`Custos AWS acima de $${threshold}: $${costData.totalCost.toFixed(2)}`);
      }

      return {
        withinLimits: critical.length === 0,
        warnings,
        critical,
      };
    } catch (error) {
      logger.error('Failed to check AWS cost limits:', error);
      return {
        withinLimits: true,
        warnings: [],
        critical: ['Erro ao verificar limites de custos AWS'],
      };
    }
  }

  /**
   * Força atualização dos dados (ignora cache)
   */
  async forceRefresh(): Promise<AWSCostData | null> {
    if (!this.isEnabled()) {
      return null;
    }

    // Limpar cache
    if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
      await cache.del(this.CACHE_KEY);
      logger.info('AWS cache cleared for force refresh');
    }

    // Buscar dados atualizados
    return this.getCostData();
  }

  /**
   * Obtém configuração do serviço
   */
  getConfiguration(): {
    enabled: boolean;
    region: string;
    cacheEnabled: boolean;
    cacheTTL: number;
  } {
    return {
      enabled: this.isEnabled(),
      region: this.REGION,
      cacheEnabled: process.env.COST_REDIS_CACHE_ENABLED === 'true',
      cacheTTL: this.CACHE_TTL,
    };
  }

  /**
   * Habilita/desabilita o serviço dinamicamente
   */
  async toggleService(enabled: boolean): Promise<void> {
    // Esta funcionalidade seria implementada para permitir toggle dinâmico
    // Por enquanto, apenas log
    logger.info(`AWS Cost Tracker ${enabled ? 'enabled' : 'disabled'} dynamically`);
  }
}

// Exportar instância singleton
export const awsCostTracker = new AWSCostTrackerService();
