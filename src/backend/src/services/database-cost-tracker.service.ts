import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { cache } from '../config/redis';

interface TableSize {
  schemaname: string;
  tablename: string;
  size: string;
  bytes: number;
}

interface DatabaseCostData {
  totalSize: number; // em bytes
  totalSizeGB: number;
  cost: number;
  tables: TableSize[];
  lastUpdated: Date;
  cacheHit: boolean;
}

interface DatabaseStats {
  totalCost: number;
  sizeBreakdown: {
    tables: number;
    indexes: number;
    total: number;
  };
  costBreakdown: {
    storage: number;
    performance: number; // Placeholder para custos de performance
  };
  trends: {
    sizeChange: number; // % de mudança vs mês anterior
    costChange: number; // % de mudança vs mês anterior
  };
}

export class DatabaseCostTrackerService {
  private readonly prisma: PrismaClient;
  private readonly CACHE_KEY: string;
  private readonly CACHE_TTL: number;
  private readonly COST_PER_GB: number;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // Usar variáveis de ambiente (ZERO hardcode)
    const redisPrefix = process.env.REDIS_KEY_PREFIX || 'fitos:';
    this.CACHE_KEY = `${redisPrefix}costs:database:tables:v1`;
    this.CACHE_TTL = parseInt(process.env.COST_CACHE_TTL_DATABASE || process.env.COST_CACHE_TTL || '1800');
    this.COST_PER_GB = parseFloat(process.env.COST_DATABASE_PER_GB || '0.10');
  }

  /**
   * Obtém tamanhos das tabelas com cache Redis
   */
  async getTableSizes(): Promise<TableSize[]> {
    try {
      // 1. Tentar cache Redis primeiro
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        const cached = await cache.get(this.CACHE_KEY);
        if (cached) {
          logger.info('Database table sizes retrieved from cache');
          return JSON.parse(cached);
        }
      }

      // 2. Buscar dados reais do PostgreSQL
      const tables = await this.fetchTableSizes();
      
      // 3. Armazenar no cache Redis
      if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
        await cache.set(this.CACHE_KEY, JSON.stringify(tables), this.CACHE_TTL);
        logger.info(`Database table sizes cached for ${this.CACHE_TTL} seconds`);
      }

      return tables;
    } catch (error) {
      logger.error('Failed to get database table sizes:', error);
      throw new Error(`Database cost tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Busca tamanhos das tabelas usando queries SQL nativas
   */
  private async fetchTableSizes(): Promise<TableSize[]> {
    const query = `
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS bytes
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY bytes DESC
      LIMIT 50
    `;
    
    try {
      const result = await this.prisma.$queryRawUnsafe<TableSize[]>(query);
      logger.info(`Retrieved ${result.length} table sizes from database`);
      return result;
    } catch (error) {
      logger.error('Failed to execute table size query:', error);
      throw error;
    }
  }

  /**
   * Calcula custos baseado no tamanho do banco
   */
  async calculateCosts(): Promise<DatabaseCostData> {
    try {
      const tables = await this.getTableSizes();
      
      // Calcular tamanho total
      const totalSize = tables.reduce((sum, table) => sum + table.bytes, 0);
      const totalSizeGB = totalSize / (1024 * 1024 * 1024);
      
      // Calcular custo
      const cost = totalSizeGB * this.COST_PER_GB;
      
      logger.info(`Database cost calculation: Size=${totalSizeGB.toFixed(2)}GB, Cost=${cost.toFixed(4)}`);

      return {
        totalSize,
        totalSizeGB,
        cost,
        tables,
        lastUpdated: new Date(),
        cacheHit: false, // Será atualizado pelo cache se aplicável
      };
    } catch (error) {
      logger.error('Failed to calculate database costs:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas detalhadas do banco de dados
   */
  async getDatabaseStats(): Promise<{
    totalConnections: number;
    activeConnections: number;
    maxConnections: number;
    cacheHitRatio: number;
    slowQueries: number;
    deadlocks: number;
  }> {
    try {
      // Query para estatísticas de conexões
      const connectionQuery = `
        SELECT 
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      `;
      
      const connectionResult = await this.prisma.$queryRawUnsafe<{
        active_connections: number;
        max_connections: number;
      }[]>(connectionQuery);

      // Query para cache hit ratio
      const cacheQuery = `
        SELECT 
          round(
            (sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read)))::numeric, 
            2
          ) as cache_hit_ratio
        FROM pg_stat_database 
        WHERE datname = current_database()
      `;
      
      const cacheResult = await this.prisma.$queryRawUnsafe<{
        cache_hit_ratio: number;
      }[]>(cacheQuery);

      // Query para queries lentas (últimas 24h)
      const slowQueryQuery = `
        SELECT count(*) as slow_queries
        FROM pg_stat_statements 
        WHERE mean_exec_time > 1000
        AND query_start > NOW() - INTERVAL '24 hours'
      `;
      
      const slowQueryResult = await this.prisma.$queryRawUnsafe<{
        slow_queries: number;
      }[]>(slowQueryQuery);

      const connections = connectionResult[0];
      const cacheHit = cacheResult[0];
      const slowQueries = slowQueryResult[0];

      return {
        totalConnections: connections.max_connections,
        activeConnections: connections.active_connections,
        maxConnections: connections.max_connections,
        cacheHitRatio: cacheHit.cache_hit_ratio || 0,
        slowQueries: slowQueries.slow_queries || 0,
        deadlocks: 0, // Placeholder - implementar se necessário
      };
    } catch (error) {
      logger.error('Failed to get database stats:', error);
      // Retornar valores padrão em caso de erro
      return {
        totalConnections: 0,
        activeConnections: 0,
        maxConnections: 0,
        cacheHitRatio: 0,
        slowQueries: 0,
        deadlocks: 0,
      };
    }
  }

  /**
   * Obtém estatísticas para dashboard
   */
  async getDashboardStats(): Promise<DatabaseStats> {
    try {
      const costData = await this.calculateCosts();
      const dbStats = await this.getDatabaseStats();
      
      // Calcular breakdown de tamanho
      const sizeBreakdown = {
        tables: costData.totalSize,
        indexes: 0, // Placeholder - implementar se necessário
        total: costData.totalSize,
      };

      // Calcular breakdown de custos
      const costBreakdown = {
        storage: costData.cost,
        performance: 0, // Placeholder para custos de performance
      };

      // TODO: Implementar comparação com mês anterior quando tivermos dados históricos
      const trends = {
        sizeChange: 0, // Placeholder
        costChange: 0, // Placeholder
      };

      return {
        totalCost: costData.cost,
        sizeBreakdown,
        costBreakdown,
        trends,
      };
    } catch (error) {
      logger.error('Failed to get database dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Verifica se o banco está dentro dos limites de performance
   */
  async checkPerformanceLimits(): Promise<{
    withinLimits: boolean;
    warnings: string[];
    critical: string[];
  }> {
    try {
      const stats = await this.getDatabaseStats();
      const warnings: string[] = [];
      const critical: string[] = [];

      // Verificar conexões
      const connectionPercentage = (stats.activeConnections / stats.maxConnections) * 100;
      if (connectionPercentage > 90) {
        critical.push(`Conexões de banco em ${connectionPercentage.toFixed(1)}% do limite`);
      } else if (connectionPercentage > 75) {
        warnings.push(`Conexões de banco em ${connectionPercentage.toFixed(1)}% do limite`);
      }

      // Verificar cache hit ratio
      if (stats.cacheHitRatio < 80) {
        critical.push(`Cache hit ratio baixo: ${stats.cacheHitRatio}%`);
      } else if (stats.cacheHitRatio < 90) {
        warnings.push(`Cache hit ratio baixo: ${stats.cacheHitRatio}%`);
      }

      // Verificar queries lentas
      if (stats.slowQueries > 100) {
        critical.push(`${stats.slowQueries} queries lentas nas últimas 24h`);
      } else if (stats.slowQueries > 50) {
        warnings.push(`${stats.slowQueries} queries lentas nas últimas 24h`);
      }

      return {
        withinLimits: critical.length === 0,
        warnings,
        critical,
      };
    } catch (error) {
      logger.error('Failed to check database performance limits:', error);
      return {
        withinLimits: true,
        warnings: [],
        critical: ['Erro ao verificar limites de performance'],
      };
    }
  }

  /**
   * Força atualização dos dados (ignora cache)
   */
  async forceRefresh(): Promise<DatabaseCostData> {
    // Limpar cache
    if (process.env.COST_REDIS_CACHE_ENABLED === 'true') {
      await cache.del(this.CACHE_KEY);
      logger.info('Database cache cleared for force refresh');
    }

    // Buscar dados atualizados
    return this.calculateCosts();
  }

  /**
   * Obtém top 10 tabelas por tamanho
   */
  async getTopTablesBySize(limit: number = 10): Promise<TableSize[]> {
    const tables = await this.getTableSizes();
    return tables.slice(0, limit);
  }

  /**
   * Obtém crescimento de tamanho por período (placeholder)
   */
  async getSizeGrowth(period: 'week' | 'month' | 'quarter'): Promise<{
    period: string;
    growth: number; // em bytes
    growthPercentage: number;
  }> {
    // TODO: Implementar quando tivermos dados históricos
    return {
      period,
      growth: 0,
      growthPercentage: 0,
    };
  }
}

// Exportar instância singleton (será inicializada com Prisma)
export let databaseCostTracker: DatabaseCostTrackerService;

export function initializeDatabaseCostTracker(prisma: PrismaClient) {
  databaseCostTracker = new DatabaseCostTrackerService(prisma);
  return databaseCostTracker;
}
