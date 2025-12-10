import { PrismaClient } from '@prisma/client';
import { DbStrategy } from '@prisma/client';
import { logger } from '../utils/logger';
import { ConnectionInfo } from './connection-manager.service';
import { SSHTunnelService, SSHTunnelConfig } from './ssh-tunnel.service';

/**
 * Factory para criar conexões Prisma baseadas na estratégia de multi-tenancy
 */
export class ConnectionFactoryService {
  private sshTunnelService: SSHTunnelService;

  constructor() {
    this.sshTunnelService = new SSHTunnelService();
    logger.info('ConnectionFactoryService initialized');
  }

  /**
   * Cria um PrismaClient apropriado para a estratégia
   */
  async createConnection(
    organizationId: string,
    strategy: DbStrategy
  ): Promise<PrismaClient> {
    switch (strategy) {
      case 'row_level':
        return this.createRowLevelConnection(organizationId);
      
      case 'schema_level':
        return this.createSchemaLevelConnection(organizationId);
      
      case 'database_level':
        throw new Error('Database-level connections must be created via createDatabaseLevelConnection with connection info');
      
      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  /**
   * Cria conexão para row-level (banco compartilhado, filtro por tenant_id)
   */
  private createRowLevelConnection(organizationId: string): PrismaClient {
    // Usa conexão padrão do banco principal
    // O tenant context será injetado via middleware
    const baseUrl = process.env.DATABASE_URL!;
    const isDev = process.env.NODE_ENV !== 'production';
    const connectionLimit = isDev ? 5 : 20;
    const poolTimeout = isDev ? 30 : 60;
    const connectTimeout = isDev ? 30 : 60;
    let urlWithPool = baseUrl.includes('?')
      ? `${baseUrl}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`
      : `${baseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`;

    // Forçar SSL quando não for localhost e sslmode não especificado
    try {
      const u = new URL(urlWithPool);
      const host = u.hostname || '';
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      if (!u.searchParams.get('sslmode') && !isLocal) {
        u.searchParams.set('sslmode', 'require');
        urlWithPool = u.toString();
      }
    } catch {}
    
    const client = new PrismaClient({
      datasources: {
        db: {
          url: urlWithPool,
        },
      },
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log queries apenas em modo debug
    if (process.env.DEBUG_QUERIES === 'true') {
      (client as any).$on('query', (e: any) => {
        logger.debug('Query:', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
          organizationId,
        });
      });
    }

    return client;
  }

  /**
   * Cria conexão para schema-level (schema dedicado por tenant)
   */
  private createSchemaLevelConnection(organizationId: string): PrismaClient {
    const baseUrl = process.env.DATABASE_URL!;
    const schemaName = this.sanitizeSchemaName(`tenant_${organizationId}`);
    
    // Adicionar schema ao search_path
    const isDev = process.env.NODE_ENV !== 'production';
    const connectionLimit = isDev ? 5 : 20;
    const poolTimeout = isDev ? 30 : 60;
    const connectTimeout = isDev ? 30 : 60;
    let baseWithPool = baseUrl.includes('?')
      ? `${baseUrl}&connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`
      : `${baseUrl}?connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}&connect_timeout=${connectTimeout}`;
    // Forçar SSL quando não for localhost e sslmode não especificado
    try {
      const u = new URL(baseWithPool);
      const host = u.hostname || '';
      const isLocal = host === 'localhost' || host === '127.0.0.1';
      if (!u.searchParams.get('sslmode') && !isLocal) {
        u.searchParams.set('sslmode', 'require');
        baseWithPool = u.toString();
      }
    } catch {}
    const url = this.addSchemaToUrl(baseWithPool, schemaName);
    
    const client = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Set search_path após conectar
    client.$connect().then(() => {
      client.$executeRawUnsafe(`SET search_path TO ${schemaName}, public`);
    }).catch((err) => {
      logger.error('Failed to set search_path:', err);
    });

    return client;
  }

  /**
   * Cria conexão para database-level (database dedicado, possivelmente via SSH)
   */
  async createDatabaseLevelConnection(
    organizationId: string,
    connectionInfo: ConnectionInfo
  ): Promise<PrismaClient> {
    if (!connectionInfo) {
      throw new Error(`Connection info is required for database-level connection`);
    }

    // Se SSH está habilitado, usar túnel SSH
    let connectionUrl: string;
    
    if (connectionInfo.sshEnabled && connectionInfo.sshHost && connectionInfo.sshKey) {
      const tunnelId = `tunnel_${organizationId}`;
      const tunnelConfig: SSHTunnelConfig = {
        sshHost: connectionInfo.sshHost,
        sshPort: connectionInfo.sshPort || 22,
        sshUsername: connectionInfo.sshUsername || 'ubuntu',
        sshKey: connectionInfo.sshKey,
        remoteHost: connectionInfo.host,
        remotePort: connectionInfo.port,
      };
      
      const tunnel = await this.sshTunnelService.getTunnel(tunnelId, tunnelConfig);
      
      // Usar porta local do túnel SSH
      connectionUrl = this.buildConnectionString({
        host: 'localhost',
        port: tunnel.localPort,
        database: connectionInfo.databaseName,
        username: connectionInfo.username,
        password: connectionInfo.password,
        ssl: connectionInfo.sslEnabled,
      });
    } else {
      connectionUrl = this.buildConnectionString({
        host: connectionInfo.host,
        port: connectionInfo.port,
        database: connectionInfo.databaseName,
        username: connectionInfo.username,
        password: connectionInfo.password,
        ssl: connectionInfo.sslEnabled,
      });
    }

    const client = new PrismaClient({
      datasources: {
        db: {
          url: connectionUrl,
        },
      },
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });

    return client;
  }

  /**
   * Sanitiza nome de schema para segurança
   */
  private sanitizeSchemaName(name: string): string {
    // Remove caracteres especiais, mantém apenas alfanuméricos e underscore
    return name.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  }

  /**
   * Adiciona schema ao search_path na URL de conexão
   */
  private addSchemaToUrl(baseUrl: string, schema: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('schema', schema);
    return url.toString();
  }

  /**
   * Constrói connection string PostgreSQL
   */
  private buildConnectionString(config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  }): string {
    const sslMode = config.ssl ? 'require' : 'disable';
    
    return `postgresql://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}?sslmode=${sslMode}`;
  }
}

