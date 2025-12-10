import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { ProviderIntegrationService } from './provider-integration.service';
import { EncryptionService } from './encryption.service';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

/**
 * Serviço de automação para escanear servidores SSH e verificar conexões de banco de dados
 */
export class ServerScanAutomationService {
  private prisma: PrismaClient;
  private providerService: ProviderIntegrationService;
  private encryptionService: EncryptionService;
  private redis: Redis | null = null;
  private scanInterval: NodeJS.Timeout | null = null;
  private isScanning: boolean = false;

  constructor() {
    this.prisma = getPrismaClient();
    this.providerService = new ProviderIntegrationService();
    this.encryptionService = new EncryptionService();
    
    // Inicializar Redis se disponível
    try {
      const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl as any);
        logger.info('Redis connected for server scan automation');
      }
    } catch (error) {
      logger.warn('Redis not available for server scan automation');
    }
  }

  /**
   * Retry wrapper com reconexão para operações Prisma
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
            await new Promise(resolve => setTimeout(resolve, 300 * (i + 1)));
            // Tentar desconectar e reconectar
            try {
              await this.prisma.$disconnect();
            } catch (disconnectError) {
              // Ignorar erros de disconnect (pode já estar desconectado)
            }
            // Obter nova instância do Prisma
            this.prisma = getPrismaClient();
            await this.prisma.$connect();
            logger.info(`✅ Prisma reconnected after P1017`);
          } catch (reconnectError: any) {
            logger.warn(`⚠️ Failed to reconnect Prisma, will retry operation:`, reconnectError?.message || reconnectError);
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
        
        throw error;
      }
    }
    throw new Error('Max retries exceeded for Prisma operation');
  }

  /**
   * Inicia automação periódica de scan
   */
  startAutoScan(intervalMinutes: number = 5): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }

    logger.info(`Starting automatic server scan (interval: ${intervalMinutes} minutes, initial delay: 30s)`);

    // Executar após delay inicial para garantir que o banco esteja pronto (30 segundos)
    setTimeout(() => {
      this.scanAllServers().catch(err => {
        // Log apenas como warning, não como error, para não bloquear inicialização
        logger.warn('Initial server scan failed (will retry on next interval):', err.message);
      });
    }, 30000); // 30 segundos de delay

    // Agendar execução periódica
    this.scanInterval = setInterval(async () => {
      if (!this.isScanning) {
        await this.scanAllServers();
      } else {
        logger.debug('Skipping scan - previous scan still in progress');
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Para automação periódica
   */
  stopAutoScan(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
      logger.info('Stopped automatic server scan');
    }
  }

  /**
   * Escaneia todos os servidores com chave SSH configurada
   */
  async scanAllServers(): Promise<void> {
    if (this.isScanning) {
      logger.debug('Scan already in progress, skipping');
      return;
    }

    this.isScanning = true;
    try {
      logger.debug('Starting scan of all servers...');

      // Buscar servidores com chave SSH configurada
      const servers = await this.prisma.databaseConnection.findMany({
        where: {
          databaseName: '__server__',
          status: 'active',
        },
        select: {
          id: true,
          host: true,
          port: true,
          username: true,
        },
      });

      logger.debug(`Found ${servers.length} servers to scan`);

      // Verificar chaves SSH e escanear cada servidor com concorrência limitada
      const concurrency = Math.max(1, Math.min(3, Number(process.env.SCAN_CONCURRENCY) || 2));
      let index = 0;
      const worker = async () => {
        while (index < servers.length) {
          const current = index++;
          const server = servers[current];
          try {
            await this.scanServer(server.id);
          } catch (err) {
            logger.error(`Error scanning server ${server.id}:`, err);
          }
        }
      };
      const workers = Array.from({ length: concurrency }, () => worker());
      await Promise.allSettled(workers);
      logger.debug(`Completed scan of ${servers.length} servers`);
    } catch (error) {
      logger.error('Error during server scan:', error);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Escaneia um servidor específico
   */
  async scanServer(serverId: string): Promise<{
    postgres: any[];
    redis: any[];
    foundConnections: any[];
  }> {
    try {
      // Buscar servidor com retry
      const server = await this.withPrismaRetry(() => 
        this.prisma.databaseConnection.findUnique({
          where: { id: serverId },
          select: {
            id: true,
            host: true,
            port: true,
            username: true,
            databaseName: true,
          },
        })
      );

      if (!server || server.databaseName !== '__server__') {
        throw new Error('Server not found or invalid');
      }

      // Buscar chave SSH do Redis
      const sshKey = await this.getServerSSHKey(serverId);
      if (!sshKey) {
        logger.debug(`No SSH key found for server ${serverId}, skipping scan`);
        return { postgres: [], redis: [], foundConnections: [] };
      }

      // Coletar saúde e containers (Postgres e Redis) na mesma conexão SSH
      const combined = await this.providerService.getHealthAndContainersViaSSH({
        sshHost: server.host,
        sshPort: server.port || 22,
        sshUsername: server.username || 'root',
        sshKey,
      }).catch(() => ({ health: null as any, postgres: [], redis: [] as any[] }));
      const postgresContainers = combined.postgres || [];
      const redisContainers = combined.redis || [];

      // Buscar conexões já cadastradas para este servidor/host com retry
      const existingConnections = await this.withPrismaRetry(() =>
        this.prisma.databaseConnection.findMany({
          where: {
            host: server.host,
            databaseName: { not: '__server__' },
          },
          select: {
            id: true,
            name: true,
            host: true,
            port: true,
            provider: true,
            databaseName: true,
          },
        })
      );

      // Salvar resultados no cache (Redis ou memória)
      const scanResult = {
        postgres: postgresContainers,
        redis: redisContainers,
        foundConnections: existingConnections,
        scannedAt: new Date().toISOString(),
        health: combined.health || null,
      };

      await this.saveScanResult(serverId, scanResult);

      logger.debug(`Server ${serverId} scanned: ${postgresContainers.length} Postgres, ${redisContainers.length} Redis containers`);

      return {
        postgres: postgresContainers,
        redis: redisContainers,
        foundConnections: existingConnections,
      };
    } catch (error: any) {
      logger.error(`Error scanning server ${serverId}:`, error);
      throw error;
    }
  }

  /**
   * Obtém último resultado de scan de um servidor
   */
  async getScanResult(serverId: string): Promise<any | null> {
    try {
      if (this.redis) {
        const cached = await this.redis.get(`fitos:servers:scan:${serverId}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
      return null;
    } catch (error) {
      logger.error(`Error getting scan result for server ${serverId}:`, error);
      return null;
    }
  }

  /**
   * Obtém todos os resultados de scan
   */
  async getAllScanResults(): Promise<Record<string, any>> {
    try {
      if (this.redis) {
        const keys = await this.redis.keys('fitos:servers:scan:*');
        const results: Record<string, any> = {};
        
        for (const key of keys) {
          const serverId = key.replace('fitos:servers:scan:', '');
          const cached = await this.redis.get(key);
          if (cached) {
            results[serverId] = JSON.parse(cached);
          }
        }
        
        return results;
      }
      return {};
    } catch (error) {
      logger.error('Error getting all scan results:', error);
      return {};
    }
  }

  /**
   * Obtém chave SSH do servidor (Redis)
   */
  private async getServerSSHKey(serverId: string): Promise<string | null> {
    try {
      if (!this.redis) return null;
      
      const key = `fitos:servers:sshkey:${serverId}`;
      const encrypted = await this.redis.get(key);
      
      if (!encrypted) return null;
      
      return this.encryptionService.decrypt(encrypted);
    } catch (error) {
      logger.error(`Error getting SSH key for server ${serverId}:`, error);
      return null;
    }
  }

  /**
   * Salva resultado de scan no cache
   */
  public async saveScanResult(serverId: string, result: any): Promise<void> {
    try {
      if (this.redis) {
        const key = `fitos:servers:scan:${serverId}`;
        await this.redis.setex(key, 3600, JSON.stringify(result)); // TTL 1 hora
      }
    } catch (error) {
      logger.error(`Error saving scan result for server ${serverId}:`, error);
    }
  }

  /**
   * Limpa resultado de scan de um servidor
   */
  async clearScanResult(serverId: string): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.del(`fitos:servers:scan:${serverId}`);
      }
    } catch (error) {
      logger.error(`Error clearing scan result for server ${serverId}:`, error);
    }
  }
}

