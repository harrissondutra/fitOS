import { logger } from '../utils/logger';
import { cache } from '../config/redis';

interface CloudinaryUsage {
  credits: {
    usage: number;
    limit: number;
    reset_at: string;
  };
  bandwidth: {
    used: number;
    limit: number;
    reset_at: string;
  };
  storage: {
    used: number;
    limit: number;
    reset_at: string;
  };
  transformations: {
    used: number;
    limit: number;
    reset_at: string;
  };
}

interface CloudinaryCostData {
  usage: CloudinaryUsage;
  cost: number;
  currency: string;
  lastUpdated: Date;
  cacheHit: boolean;
}

export class CloudinaryCostTrackerService {
  private readonly CACHE_KEY: string;
  private readonly CACHE_TTL: number;
  private readonly FREE_CREDITS: number;
  private readonly COST_PER_CREDIT: number;
  private readonly COST_PER_GB_BANDWIDTH: number;
  private readonly COST_PER_GB_STORAGE: number;

  constructor() {
    // Usar variáveis de ambiente (ZERO hardcode)
    const redisPrefix = process.env.REDIS_KEY_PREFIX || 'fitos:';
    this.CACHE_KEY = `${redisPrefix}costs:cloudinary:usage:v1`;
    this.CACHE_TTL = parseInt(process.env.COST_CACHE_TTL_CLOUDINARY || process.env.COST_CACHE_TTL || '7200');
    this.FREE_CREDITS = parseInt(process.env.COST_CLOUDINARY_FREE_CREDITS || '25');
    this.COST_PER_CREDIT = parseFloat(process.env.COST_CLOUDINARY_PER_CREDIT || '0.0018');
    this.COST_PER_GB_BANDWIDTH = parseFloat(process.env.COST_BANDWIDTH_PER_GB || '0.08');
    this.COST_PER_GB_STORAGE = parseFloat(process.env.COST_DATABASE_PER_GB || '0.10'); // Reutilizar variável existente
  }

  /**
   * Obtém dados de uso do Cloudinary com cache Redis
   */
  async getUsageStats(): Promise<CloudinaryCostData> {
    try {
      // 1. Tentar cache Redis primeiro
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        const cached = await cache.get(this.CACHE_KEY);
        if (cached) {
          logger.info('Cloudinary usage data retrieved from cache');
          return {
            ...JSON.parse(cached),
            cacheHit: true,
            lastUpdated: new Date(),
          };
        }
      }

      // 2. Buscar dados reais da API do Cloudinary
      const usageData = await this.fetchCloudinaryUsage();
      
      // 3. Calcular custos
      const cost = this.calculateCost(usageData);
      
      // 4. Preparar dados para retorno
      const costData: CloudinaryCostData = {
        usage: usageData,
        cost,
        currency: process.env.COST_DEFAULT_CURRENCY || 'BRL',
        lastUpdated: new Date(),
        cacheHit: false,
      };

      // 5. Armazenar no cache Redis
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        await cache.set(this.CACHE_KEY, JSON.stringify(costData), this.CACHE_TTL);
        logger.info(`Cloudinary usage data cached for ${this.CACHE_TTL} seconds`);
      }

      return costData;
    } catch (error) {
      logger.error('Failed to get Cloudinary usage stats:', error);
      throw new Error(`Cloudinary cost tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Busca dados reais da API do Cloudinary Admin
   */
  private async fetchCloudinaryUsage(): Promise<CloudinaryUsage> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials not configured');
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/usage`;
    
    // Basic Auth header
    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudinary API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Mapear resposta da API para nossa interface
    return {
      credits: {
        usage: data.credits?.used || 0,
        limit: data.credits?.limit || 0,
        reset_at: data.credits?.reset_at || new Date().toISOString(),
      },
      bandwidth: {
        used: data.bandwidth?.used || 0,
        limit: data.bandwidth?.limit || 0,
        reset_at: data.bandwidth?.reset_at || new Date().toISOString(),
      },
      storage: {
        used: data.storage?.used || 0,
        limit: data.storage?.limit || 0,
        reset_at: data.storage?.reset_at || new Date().toISOString(),
      },
      transformations: {
        used: data.transformations?.used || 0,
        limit: data.transformations?.limit || 0,
        reset_at: data.transformations?.reset_at || new Date().toISOString(),
      },
    };
  }

  /**
   * Calcula custos baseado no uso e preços configurados
   */
  private calculateCost(usage: CloudinaryUsage): number {
    let totalCost = 0;

    // 1. Custos de créditos (transformações)
    const creditsUsed = usage.credits.usage;
    const extraCredits = Math.max(0, creditsUsed - this.FREE_CREDITS);
    const creditsCost = extraCredits * this.COST_PER_CREDIT;
    totalCost += creditsCost;

    // 2. Custos de bandwidth (GB)
    const bandwidthGB = usage.bandwidth.used / (1024 * 1024 * 1024); // Converter bytes para GB
    const bandwidthCost = bandwidthGB * this.COST_PER_GB_BANDWIDTH;
    totalCost += bandwidthCost;

    // 3. Custos de storage (GB)
    const storageGB = usage.storage.used / (1024 * 1024 * 1024); // Converter bytes para GB
    const storageCost = storageGB * this.COST_PER_GB_STORAGE;
    totalCost += storageCost;

    logger.info(`Cloudinary cost calculation: Credits=${creditsCost.toFixed(4)}, Bandwidth=${bandwidthCost.toFixed(4)}, Storage=${storageCost.toFixed(4)}, Total=${totalCost.toFixed(4)}`);

    return totalCost;
  }

  /**
   * Força atualização dos dados (ignora cache)
   */
  async forceRefresh(): Promise<CloudinaryCostData> {
    // Limpar cache
    if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
      await cache.del(this.CACHE_KEY);
      logger.info('Cloudinary cache cleared for force refresh');
    }

    // Buscar dados atualizados
    return this.getUsageStats();
  }

  /**
   * Verifica se os dados estão dentro dos limites configurados
   */
  async checkLimits(): Promise<{
    withinLimits: boolean;
    warnings: string[];
    critical: string[];
  }> {
    const data = await this.getUsageStats();
    const warnings: string[] = [];
    const critical: string[] = [];

    // Verificar limites de créditos
    const creditsPercentage = (data.usage.credits.usage / data.usage.credits.limit) * 100;
    if (creditsPercentage > 90) {
      critical.push(`Créditos Cloudinary em ${creditsPercentage.toFixed(1)}% do limite`);
    } else if (creditsPercentage > 75) {
      warnings.push(`Créditos Cloudinary em ${creditsPercentage.toFixed(1)}% do limite`);
    }

    // Verificar limites de bandwidth
    const bandwidthPercentage = (data.usage.bandwidth.used / data.usage.bandwidth.limit) * 100;
    if (bandwidthPercentage > 90) {
      critical.push(`Bandwidth Cloudinary em ${bandwidthPercentage.toFixed(1)}% do limite`);
    } else if (bandwidthPercentage > 75) {
      warnings.push(`Bandwidth Cloudinary em ${bandwidthPercentage.toFixed(1)}% do limite`);
    }

    // Verificar limites de storage
    const storagePercentage = (data.usage.storage.used / data.usage.storage.limit) * 100;
    if (storagePercentage > 90) {
      critical.push(`Storage Cloudinary em ${storagePercentage.toFixed(1)}% do limite`);
    } else if (storagePercentage > 75) {
      warnings.push(`Storage Cloudinary em ${storagePercentage.toFixed(1)}% do limite`);
    }

    return {
      withinLimits: critical.length === 0,
      warnings,
      critical,
    };
  }

  /**
   * Obtém estatísticas de uso para dashboard
   */
  async getDashboardStats(): Promise<{
    totalCost: number;
    costBreakdown: {
      credits: number;
      bandwidth: number;
      storage: number;
    };
    usageBreakdown: {
      credits: { used: number; limit: number; percentage: number };
      bandwidth: { used: number; limit: number; percentage: number };
      storage: { used: number; limit: number; percentage: number };
    };
    trends: {
      costChange: number; // % de mudança vs mês anterior
      usageChange: number; // % de mudança vs mês anterior
    };
  }> {
    const data = await this.getUsageStats();
    
    const costBreakdown = {
      credits: Math.max(0, (data.usage.credits.usage - this.FREE_CREDITS)) * this.COST_PER_CREDIT,
      bandwidth: (data.usage.bandwidth.used / (1024 * 1024 * 1024)) * this.COST_PER_GB_BANDWIDTH,
      storage: (data.usage.storage.used / (1024 * 1024 * 1024)) * this.COST_PER_GB_STORAGE,
    };

    const usageBreakdown = {
      credits: {
        used: data.usage.credits.usage,
        limit: data.usage.credits.limit,
        percentage: (data.usage.credits.usage / data.usage.credits.limit) * 100,
      },
      bandwidth: {
        used: data.usage.bandwidth.used,
        limit: data.usage.bandwidth.limit,
        percentage: (data.usage.bandwidth.used / data.usage.bandwidth.limit) * 100,
      },
      storage: {
        used: data.usage.storage.used,
        limit: data.usage.storage.limit,
        percentage: (data.usage.storage.used / data.usage.storage.limit) * 100,
      },
    };

    // TODO: Implementar comparação com mês anterior quando tivermos dados históricos
    const trends = {
      costChange: 0, // Placeholder
      usageChange: 0, // Placeholder
    };

    return {
      totalCost: data.cost,
      costBreakdown,
      usageBreakdown,
      trends,
    };
  }
}

// Exportar instância singleton
export const cloudinaryCostTracker = new CloudinaryCostTrackerService();
