import { PrismaClient, DbStrategy, Tenant, DatabaseConnection } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { ConnectionFactoryService } from './connection-factory.service';
import { SSHTunnelService, SSHTunnelConfig } from './ssh-tunnel.service';
import { EncryptionService } from './encryption.service';
import { logger } from '../utils/logger';
import { RedisService } from './redis.service';

export interface ConnectionInfo {
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
  sshEnabled: boolean;
  sshHost?: string;
  sshPort?: number;
  sshUsername?: string;
  sshKey?: string;
  sslEnabled: boolean;
}

/**
 * Connection Manager Service
 * Gerencia conexões de database baseadas na estratégia de multi-tenancy
 */
export class ConnectionManagerService {
  private connectionCache: Map<string, PrismaClient> = new Map();
  private connectionFactory: ConnectionFactoryService;
  private sshTunnelService: SSHTunnelService;
  private encryptionService: EncryptionService;
  private cacheService: RedisService;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.connectionFactory = new ConnectionFactoryService();
    this.sshTunnelService = new SSHTunnelService();
    this.encryptionService = new EncryptionService();
    this.cacheService = new RedisService();
    this.startHealthCheck();
    logger.info('ConnectionManagerService initialized');
  }

  /**
   * Helper para retry em operações Prisma com tratamento de P1017 (connection closed) e P2024 (pool timeout)
   */
  private async withPrismaRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        const code = error?.code || error?.meta?.code;
        const message = error?.message || '';
        
        // P1017: Server closed connection - reconectar e retry
        if (code === 'P1017' && i < maxRetries - 1) {
          logger.warn(`Prisma connection closed (P1017), attempting reconnect... Attempt ${i + 1}/${maxRetries}`);
          
          try {
            // Aguardar antes de tentar reconectar
            await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
            
            // Tentar reconectar o cliente Prisma
            const prisma = getPrismaClient();
            try {
              await prisma.$disconnect();
            } catch (disconnectError) {
              // Ignorar erros de disconnect (pode já estar desconectado)
            }
            
            // Reconectar
            await prisma.$connect();
            logger.info(`✅ Prisma reconnected after P1017`);
          } catch (reconnectError: any) {
            logger.warn(`⚠️ Failed to reconnect Prisma, will retry operation:`, reconnectError?.message || reconnectError);
            // Continuar com retry mesmo se reconexão falhar
          }
          
          continue;
        }
        
        // P2024: Connection pool timeout - retry com backoff exponencial
        if (code === 'P2024' && i < maxRetries - 1) {
          logger.warn(`Prisma pool timeout (P2024), retrying in ${200 * (i + 1)}ms... Attempt ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
          continue;
        }
        
        // P1001: Database unreachable - não retry, mas logar
        if (code === 'P1001') {
          logger.error(`Database unreachable (P1001):`, message);
          throw error;
        }
        
        // Se a mensagem indica conexão fechada (mesmo sem código P1017)
        if ((message.includes('closed the connection') || message.includes('connection closed')) && i < maxRetries - 1) {
          logger.warn(`Connection closed detected, retrying in ${300 * (i + 1)}ms... Attempt ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
          continue;
        }
        
        // Outros erros ou última tentativa falhou
        throw error;
      }
    }
    throw new Error('Max retries exceeded for Prisma operation');
  }

  /**
   * Obtém conexão apropriada para uma organização
   */
  async getConnection(organizationId: string): Promise<PrismaClient> {
    // Verificar cache em memória primeiro
    const cachedConnection = this.connectionCache.get(organizationId);
    if (cachedConnection) {
      return cachedConnection;
    }

    // Verificar cache Redis (estratégia)
    const cachedStrategy = await this.getCachedStrategy(organizationId);
    
    // Se não tem estratégia em cache, buscar do banco
    const prisma = getPrismaClient();
    const tenant = await this.withPrismaRetry(() => prisma.tenant.findUnique({
      where: { id: organizationId },
      select: { dbStrategy: true, status: true },
    }));

    if (!tenant) {
      throw new Error(`Organization not found: ${organizationId}`);
    }

    if (tenant.status !== 'active') {
      throw new Error(`Organization is not active: ${organizationId}`);
    }

    // Cachear estratégia no Redis
    await this.cacheStrategy(organizationId, tenant.dbStrategy);

    // Criar conexão apropriada
    let connection: PrismaClient;
    
    if (tenant.dbStrategy === 'database_level') {
      const connectionInfo = await this.getConnectionInfo(organizationId);
      if (!connectionInfo) {
        throw new Error(`No connection info found for database-level organization ${organizationId}`);
      }
      connection = await this.connectionFactory.createDatabaseLevelConnection(
        organizationId,
        connectionInfo
      );
    } else {
      connection = await this.connectionFactory.createConnection(
        organizationId,
        tenant.dbStrategy
      );
    }

    // Cachear conexão em memória
    this.connectionCache.set(organizationId, connection);

    return connection;
  }

  /**
   * Obtém a estratégia de banco de dados para uma organização
   */
  async getOrganizationStrategy(organizationId: string): Promise<DbStrategy> {
    const cachedStrategy = await this.getCachedStrategy(organizationId);
    if (cachedStrategy) {
      return cachedStrategy;
    }

    const prisma = getPrismaClient();
    const organization = await this.withPrismaRetry(() => prisma.tenant.findUnique({
      where: { id: organizationId },
      select: { dbStrategy: true },
    }));

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    await this.cacheStrategy(organizationId, organization.dbStrategy);
    return organization.dbStrategy;
  }

  /**
   * Obtém informações de conexão para uma organização
   */
  async getConnectionInfo(organizationId: string): Promise<ConnectionInfo | null> {
    const prisma = getPrismaClient();
    
    const connection = await this.withPrismaRetry(() => prisma.databaseConnection.findFirst({
      where: {
        organizationId,
      },
    }));

    if (!connection) return null;

    const decryptedPassword = this.encryptionService.decrypt(connection.encryptedPassword);
    let decryptedSshKey: string | undefined;

    if (connection.sshEnabled && connection.encryptedSshKey) {
      decryptedSshKey = this.encryptionService.decrypt(connection.encryptedSshKey);
    }

    return {
      host: connection.host,
      port: connection.port,
      databaseName: connection.databaseName,
      username: connection.username,
      password: decryptedPassword,
      sshEnabled: connection.sshEnabled,
      sshHost: connection.sshHost || undefined,
      sshPort: connection.sshPort || undefined,
      sshUsername: connection.sshUsername || undefined,
      sshKey: decryptedSshKey,
      sslEnabled: connection.sslEnabled,
    };
  }

  /**
   * Obtém túnel SSH para database-level com SSH habilitado
   */
  async getSSHTunnel(
    organizationId: string,
    connectionInfo: ConnectionInfo
  ): Promise<any> {
    if (!connectionInfo.sshEnabled) {
      throw new Error('SSH is not enabled for this connection');
    }

    if (!connectionInfo.sshHost || !connectionInfo.sshKey) {
      throw new Error('SSH configuration is incomplete');
    }

    const tunnelId = `tunnel_${organizationId}`;
    const tunnelConfig: SSHTunnelConfig = {
      sshHost: connectionInfo.sshHost,
      sshPort: connectionInfo.sshPort || 22,
      sshUsername: connectionInfo.sshUsername || 'ubuntu',
      sshKey: connectionInfo.sshKey,
      remoteHost: connectionInfo.host,
      remotePort: connectionInfo.port,
    };

    return await this.sshTunnelService.getTunnel(tunnelId, tunnelConfig);
  }

  /**
   * Cachea estratégia no Redis
   */
  private async cacheStrategy(organizationId: string, strategy: DbStrategy): Promise<void> {
    try {
      await this.cacheService.set(
        `strategy:${organizationId}`,
        strategy,
        { namespace: 'organization', ttl: 3600 } // 1 hora
      );
    } catch (error) {
      logger.warn('Failed to cache strategy:', error);
      // Não bloquear se cache falhar
    }
  }

  /**
   * Obtém estratégia do cache Redis
   */
  private async getCachedStrategy(organizationId: string): Promise<DbStrategy | null> {
    try {
      const cached = await this.cacheService.get<DbStrategy>(
        `strategy:${organizationId}`,
        { namespace: 'organization' }
      );
      return cached;
    } catch (error) {
      logger.warn('Failed to get cached strategy:', error);
      return null;
    }
  }

  /**
   * Health check periódico de conexões
   */
  private startHealthCheck(): void {
    const retry = async (op: () => Promise<any>, retries = 3) => {
      let lastErr: any;
      for (let i = 1; i <= retries; i++) {
        try { return await op(); } catch (e: any) {
          const code = e?.code || e?.meta?.code;
          if ((code === 'P1017' || code === 'P2024') && i < retries) {
            await new Promise(r => setTimeout(r, 200 * i));
            lastErr = e; continue;
          }
          throw e;
        }
      }
      throw lastErr;
    };

    this.healthCheckInterval = setInterval(async () => {
      for (const [organizationId, connection] of this.connectionCache.entries()) {
        try {
          await retry(() => connection.$queryRaw`SELECT 1`);
          logger.debug(`Health check OK for organization: ${organizationId}`);
        } catch (error) {
          logger.error(`Health check failed for organization ${organizationId}:`, error);
          // Remover conexão falha do cache
          this.connectionCache.delete(organizationId);
          // Invalidar cache Redis
          try {
            await this.cacheService.del(`strategy:${organizationId}`, { namespace: 'organization' });
          } catch (err) {
            logger.warn('Failed to invalidate cache:', err);
          }
        }
      }
    }, 5 * 60 * 1000); // A cada 5 minutos
  }

  /**
   * Limpa cache de conexões
   */
  clearCache(organizationId?: string): void {
    if (organizationId) {
      this.connectionCache.delete(organizationId);
    } else {
      this.connectionCache.clear();
    }
  }

  /**
   * Shutdown - fecha todas as conexões
   */
  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Fechar todas as conexões Prisma
    const closePromises = Array.from(this.connectionCache.values()).map(connection =>
      connection.$disconnect().catch(err => logger.error('Error disconnecting Prisma:', err))
    );

    await Promise.all(closePromises);
    this.connectionCache.clear();
    
    // Fechar túneis SSH
    await this.sshTunnelService.shutdown();
    
    logger.info('ConnectionManagerService shutdown complete');
  }
}
