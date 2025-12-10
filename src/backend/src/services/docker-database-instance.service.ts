import { PrismaClient, DatabaseType, DatabaseInstanceStatus, DatabaseProvider } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { ProviderIntegrationService } from './provider-integration.service';
import { EncryptionService } from './encryption.service';
import { parseConnectionString, mapProvisionTargetToProvider } from '../utils/connection-string-parser';
import Redis from 'ioredis';

export interface CreateDatabaseInstanceData {
  serverId?: string; // Opcional para conexões externas
  tenantId: string;
  databaseType: DatabaseType;
  databaseName: string;
  containerName?: string;
  port?: number;
  username?: string;
  password?: string;
  schemaName?: string; // Para PostgreSQL
  image?: string; // Docker image opcional
  
  // Campos para conexões externas
  provisionTarget?: string; // vps_ssh, railway, supabase, etc.
  provider?: DatabaseProvider;
  externalHost?: string;
  externalPort?: number;
  externalUsername?: string;
  externalPassword?: string;
  connectionString?: string; // Connection string completa (opcional)
}

export interface DatabaseInstanceWithDetails {
  id: string;
  serverId: string | null;
  tenantId: string;
  tenantName: string;
  serverName: string | null;
  serverHost: string | null;
  provider: DatabaseProvider | null;
  externalHost: string | null;
  databaseType: DatabaseType;
  databaseName: string;
  containerName: string | null;
  port: number;
  username: string;
  schemaName: string | null;
  status: DatabaseInstanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseContainerInfo {
  containerName: string;
  image: string;
  host: string;
  hostPort?: number;
  dbName?: string;
  username?: string;
  password?: string;
  databaseType: 'postgresql' | 'mysql' | 'redis';
  isManaged: boolean; // Se está gerenciado pelo sistema
  instanceId?: string; // ID da instância gerenciada
  serverId?: string; // ID do servidor onde o container está rodando
  serverName?: string; // Nome do servidor onde o container está rodando
}

/**
 * Docker Database Instance Service
 * Gerencia criação e monitoramento de bancos de dados Docker criados pelo sistema
 */
export class DockerDatabaseInstanceService {
  private prisma: PrismaClient;
  private providerIntegration: ProviderIntegrationService;
  private encryptionService: EncryptionService;

  constructor() {
    this.prisma = getPrismaClient();
    this.providerIntegration = new ProviderIntegrationService();
    this.encryptionService = new EncryptionService();
    logger.info('DockerDatabaseInstanceService initialized');
  }

  /**
   * Criar nova instância de banco de dados (Docker ou conexão externa)
   */
  async createDatabaseInstance(data: CreateDatabaseInstanceData): Promise<DatabaseInstanceWithDetails> {
    logger.info('Creating database instance', { 
      serverId: data.serverId, 
      tenantId: data.tenantId, 
      databaseType: data.databaseType,
      provisionTarget: data.provisionTarget
    });

    // Validar tenant (deve ser enterprise ou custom)
    await this.validateTenantPlan(data.tenantId);

    // Determinar se é conexão externa ou VPS SSH
    const isExternal = data.provisionTarget && data.provisionTarget !== 'vps_ssh';
    
    if (isExternal) {
      return await this.createExternalDatabaseInstance(data);
    } else {
      return await this.createDockerDatabaseInstance(data);
    }
  }

  /**
   * Criar conexão externa de banco de dados (provedores cloud)
   */
  private async createExternalDatabaseInstance(data: CreateDatabaseInstanceData): Promise<DatabaseInstanceWithDetails> {
    logger.info('Creating external database connection', { 
      provider: data.provider,
      tenantId: data.tenantId 
    });

    // Parse connection string se fornecida
    let parsedConn: any = null;
    if (data.connectionString) {
      try {
        parsedConn = parseConnectionString(data.connectionString);
        logger.info('Connection string parsed successfully', { host: parsedConn.host, port: parsedConn.port });
      } catch (error) {
        throw new Error(`Invalid connection string: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Usar connection string parseada ou campos individuais
    const host = parsedConn?.host || data.externalHost;
    const port = parsedConn?.port || data.externalPort || this.getDefaultPort(data.databaseType);
    const username = parsedConn?.username || data.externalUsername || this.getDefaultUsername(data.databaseType);
    const password = parsedConn?.password || data.externalPassword;
    const database = parsedConn?.database || data.databaseName;
    const schema = parsedConn?.schema || data.schemaName;

    if (!host || !port || !username || !password) {
      throw new Error('Missing required connection information. Provide connectionString or all individual fields (externalHost, externalPort, externalUsername, externalPassword)');
    }

    // Mapear provisionTarget para provider
    const provider = data.provider || (data.provisionTarget ? mapProvisionTargetToProvider(data.provisionTarget) as DatabaseProvider : null);
    if (!provider) {
      throw new Error('Provider is required for external connections');
    }

    // Criptografar senha
    const encryptedPassword = this.encryptionService.encrypt(password);

    // Criar registro no banco
    const instance = await this.prisma.databaseInstance.create({
      data: {
        serverId: null, // Conexões externas não têm serverId
        tenantId: data.tenantId,
        databaseType: data.databaseType,
        databaseName: database,
        containerName: null, // Conexões externas não têm container
        provider: provider as DatabaseProvider,
        externalHost: host,
        port,
        username,
        encryptedPassword,
        schemaName: schema || null,
        status: 'active'
      },
      include: {
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    logger.info('External database connection created successfully', { instanceId: instance.id });

    return {
      id: instance.id,
      serverId: null,
      tenantId: instance.tenantId,
      tenantName: instance.tenant.name,
      serverName: null,
      serverHost: null,
      provider: instance.provider,
      externalHost: instance.externalHost,
      databaseType: instance.databaseType,
      databaseName: instance.databaseName,
      containerName: instance.containerName,
      port: instance.port,
      username: instance.username,
      schemaName: instance.schemaName,
      status: instance.status,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    };
  }

  /**
   * Criar banco de dados Docker em servidor VPS
   */
  private async createDockerDatabaseInstance(data: CreateDatabaseInstanceData): Promise<DatabaseInstanceWithDetails> {
    logger.info('Creating Docker database instance', { 
      serverId: data.serverId, 
      tenantId: data.tenantId 
    });

    if (!data.serverId) {
      throw new Error('ServerId is required for Docker database instances');
    }

    // Obter dados do servidor
    const server = await this.prisma.databaseConnection.findFirst({
      where: { 
        id: data.serverId,
        databaseName: '__server__' // Apenas servidores SSH
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true
      }
    });

    if (!server) {
      throw new Error('Server not found or is not a valid SSH server');
    }

    // Obter chave SSH do servidor
    const sshKey = await this.getServerSSHKey(data.serverId);
    if (!sshKey) {
      throw new Error('SSH key not configured for this server');
    }

    // Gerar valores padrão se não fornecidos
    const containerName = data.containerName || `db-${data.databaseType}-${data.tenantId.substring(0, 8)}`;
    const port = data.port || this.getDefaultPort(data.databaseType);
    const username = data.username || this.getDefaultUsername(data.databaseType);
    const password = data.password || this.generatePassword();

    // Provisionar container Docker
    let provisioned: any;
    const sshOptions = {
      sshHost: server.host,
      sshPort: server.port || 22,
      sshUsername: server.username || 'root',
      sshKey: sshKey
    };

    switch (data.databaseType) {
      case 'postgresql':
        provisioned = await this.providerIntegration.provisionDockerPostgresViaSSH({
          ...sshOptions,
          containerName,
          dbName: data.databaseName,
          dbUser: username,
          dbPassword: password,
          hostPort: port,
          image: data.image
        });

        // Criar schema específico por tenant se fornecido
        if (data.schemaName) {
          try {
            await this.providerIntegration.createPostgresSchema({
              ...sshOptions,
              containerName,
              dbName: data.databaseName,
              dbUser: username,
              dbPassword: password,
              schemaName: data.schemaName
            });
            logger.info('PostgreSQL schema created', { schemaName: data.schemaName });
          } catch (error) {
            logger.error('Failed to create PostgreSQL schema', error);
            // Não falhar a criação do banco se o schema falhar
          }
        }
        break;

      case 'mysql':
        provisioned = await this.providerIntegration.provisionDockerMySQLViaSSH({
          ...sshOptions,
          containerName,
          dbName: data.databaseName,
          dbUser: username,
          dbPassword: password,
          hostPort: port,
          image: data.image
        });
        break;

      case 'redis':
        provisioned = await this.providerIntegration.provisionDockerRedisViaSSH({
          ...sshOptions,
          containerName,
          password: password,
          hostPort: port,
          image: data.image
        });
        break;

      default:
        throw new Error(`Unsupported database type: ${data.databaseType}`);
    }

    // Salvar registro no banco
    const encryptedPassword = this.encryptionService.encrypt(password);
    
    const instance = await this.prisma.databaseInstance.create({
      data: {
        serverId: data.serverId,
        tenantId: data.tenantId,
        databaseType: data.databaseType,
        databaseName: data.databaseName,
        containerName,
        port,
        username,
        encryptedPassword,
        schemaName: data.schemaName || null,
        provider: 'vps_ssh' as DatabaseProvider,
        status: 'active'
      },
      include: {
        server: {
          select: {
            name: true,
            host: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    logger.info('Database instance created successfully', { instanceId: instance.id });

    return {
      id: instance.id,
      serverId: instance.serverId,
      tenantId: instance.tenantId,
      tenantName: instance.tenant.name,
      serverName: instance.server?.name || null,
      serverHost: instance.server?.host || null,
      provider: instance.provider,
      externalHost: instance.externalHost,
      databaseType: instance.databaseType,
      databaseName: instance.databaseName,
      containerName: instance.containerName,
      port: instance.port,
      username: instance.username,
      schemaName: instance.schemaName,
      status: instance.status,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    };
  }

  /**
   * Listar todos os bancos (containers Docker encontrados + instâncias gerenciadas)
   */
  async listAllDatabases(options?: {
    serverId?: string;
    tenantId?: string;
    databaseType?: DatabaseType;
    status?: DatabaseInstanceStatus;
  }): Promise<{
    managed: DatabaseInstanceWithDetails[];
    discovered: DatabaseContainerInfo[];
  }> {
    logger.info('Listing all databases', options);

    // Listar instâncias gerenciadas
    const where: any = {};
    if (options?.serverId) where.serverId = options.serverId;
    if (options?.tenantId) where.tenantId = options.tenantId;
    if (options?.databaseType) where.databaseType = options.databaseType;
    if (options?.status) where.status = options.status;

    const managedInstances = await this.prisma.databaseInstance.findMany({
      where,
      include: {
        server: {
          select: {
            name: true,
            host: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const managed: DatabaseInstanceWithDetails[] = managedInstances.map(instance => ({
      id: instance.id,
      serverId: instance.serverId,
      tenantId: instance.tenantId,
      tenantName: instance.tenant.name,
      serverName: instance.server?.name || null,
      serverHost: instance.server?.host || null,
      provider: instance.provider,
      externalHost: instance.externalHost,
      databaseType: instance.databaseType,
      databaseName: instance.databaseName,
      containerName: instance.containerName,
      port: instance.port,
      username: instance.username,
      schemaName: instance.schemaName,
      status: instance.status,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    }));

    // Listar containers Docker encontrados (não gerenciados)
    const discovered: DatabaseContainerInfo[] = [];
    
    const servers = await this.prisma.databaseConnection.findMany({
      where: {
        databaseName: '__server__',
        ...(options?.serverId && { id: options.serverId })
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        username: true
      }
    });

    const managedContainerNames = new Set(managedInstances.map(i => i.containerName));

    for (const server of servers) {
      const sshKey = await this.getServerSSHKey(server.id);
      if (!sshKey) continue;

      try {
        const sshOptions = {
          sshHost: server.host,
          sshPort: server.port || 22,
          sshUsername: server.username || 'root',
          sshKey: sshKey
        };

        // Listar containers PostgreSQL
        const postgresContainers = await this.providerIntegration.listDockerPostgresContainersViaSSH(sshOptions);
        for (const container of postgresContainers) {
          if (!managedContainerNames.has(container.containerName)) {
            discovered.push({
              ...container,
              databaseType: 'postgresql',
              isManaged: false,
              serverId: server.id,
              serverName: server.name
            });
          }
        }

        // Listar containers MySQL
        const mysqlContainers = await this.providerIntegration.listDockerMySQLContainersViaSSH(sshOptions);
        for (const container of mysqlContainers) {
          if (!managedContainerNames.has(container.containerName)) {
            discovered.push({
              ...container,
              databaseType: 'mysql',
              isManaged: false,
              serverId: server.id,
              serverName: server.name
            });
          }
        }

        // Listar containers Redis
        const redisContainers = await this.providerIntegration.listDockerRedisContainersViaSSH(sshOptions);
        for (const container of redisContainers) {
          if (!managedContainerNames.has(container.containerName)) {
            discovered.push({
              ...container,
              databaseType: 'redis',
              isManaged: false,
              serverId: server.id,
              serverName: server.name
            });
          }
        }
      } catch (error) {
        logger.error('Error listing containers from server', { serverId: server.id, error });
      }
    }

    // Marcar containers gerenciados
    for (const instance of managedInstances) {
      const found = discovered.find(d => d.containerName === instance.containerName);
      if (found) {
        found.isManaged = true;
        found.instanceId = instance.id;
      }
    }

    return { managed, discovered };
  }

  /**
   * Obter detalhes de uma instância
   */
  async getDatabaseInstance(id: string): Promise<DatabaseInstanceWithDetails | null> {
    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id },
      include: {
        server: {
          select: {
            name: true,
            host: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    if (!instance) return null;

    return {
      id: instance.id,
      serverId: instance.serverId,
      tenantId: instance.tenantId,
      tenantName: instance.tenant.name,
      serverName: instance.server?.name || null,
      serverHost: instance.server?.host || null,
      provider: instance.provider,
      externalHost: instance.externalHost,
      databaseType: instance.databaseType,
      databaseName: instance.databaseName,
      containerName: instance.containerName,
      port: instance.port,
      username: instance.username,
      schemaName: instance.schemaName,
      status: instance.status,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    };
  }

  /**
   * Atualizar instância de banco
   */
  async updateDatabaseInstance(
    id: string, 
    data: Partial<CreateDatabaseInstanceData & { status?: DatabaseInstanceStatus }>
  ): Promise<DatabaseInstanceWithDetails> {
    logger.info('Updating database instance', { id, data });

    const updateData: any = {};
    if (data.databaseName) updateData.databaseName = data.databaseName;
    if (data.username) updateData.username = data.username;
    if (data.password) updateData.encryptedPassword = this.encryptionService.encrypt(data.password);
    if (data.schemaName !== undefined) updateData.schemaName = data.schemaName;
    if (data.status) updateData.status = data.status;

    const instance = await this.prisma.databaseInstance.update({
      where: { id },
      data: updateData,
      include: {
        server: {
          select: {
            name: true,
            host: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      }
    });

    return {
      id: instance.id,
      serverId: instance.serverId,
      tenantId: instance.tenantId,
      tenantName: instance.tenant.name,
      serverName: instance.server?.name || null,
      serverHost: instance.server?.host || null,
      provider: instance.provider,
      externalHost: instance.externalHost,
      databaseType: instance.databaseType,
      databaseName: instance.databaseName,
      containerName: instance.containerName,
      port: instance.port,
      username: instance.username,
      schemaName: instance.schemaName,
      status: instance.status,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    };
  }

  /**
   * Deletar instância de banco e container Docker
   */
  async deleteDatabaseInstance(id: string): Promise<void> {
    logger.info('Deleting database instance', { id });

    const instance = await this.prisma.databaseInstance.findUnique({
      where: { id },
      include: {
        server: {
          select: {
            host: true,
            port: true,
            username: true
          }
        }
      }
    });

    if (!instance) {
      throw new Error('Database instance not found');
    }

    // Obter chave SSH
    const sshKey = await this.getServerSSHKey(instance.serverId);
    if (!sshKey) {
      throw new Error('SSH key not configured for this server');
    }

    // Parar e remover container Docker
    try {
      const sshOptions = {
        sshHost: instance.server.host,
        sshPort: instance.server.port || 22,
        sshUsername: instance.server.username || 'root',
        sshKey: sshKey
      };

      // Parar container
      const stopResult = await this.providerIntegration.executeSSHCommand(
        sshOptions.sshHost,
        sshOptions.sshPort || 22,
        sshOptions.sshUsername,
        sshKey,
        `docker stop ${instance.containerName} || true`
      );

      if (stopResult.error) {
        logger.warn('Error stopping container', { error: stopResult.error });
      }

      // Remover container
      const rmResult = await this.providerIntegration.executeSSHCommand(
        sshOptions.sshHost,
        sshOptions.sshPort || 22,
        sshOptions.sshUsername,
        sshKey,
        `docker rm ${instance.containerName} || true`
      );

      if (rmResult.error) {
        logger.warn('Error removing container', { error: rmResult.error });
      } else {
        logger.info('Container removed successfully', { containerName: instance.containerName });
      }
    } catch (error) {
      logger.error('Error removing container', { error, containerName: instance.containerName });
      // Continuar com a remoção do registro mesmo se falhar
    }

    // Remover registro do banco
    await this.prisma.databaseInstance.delete({
      where: { id }
    });

    logger.info('Database instance deleted successfully', { id });
  }

  /**
   * Listar tenants com planos Enterprise e Custom
   */
  async listEnterpriseAndCustomTenants(): Promise<Array<{ id: string; name: string; plan: string }>> {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        OR: [
          { planType: { in: ['enterprise', 'custom'] } },
          { plan: { in: ['enterprise', 'custom'] } }
        ],
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        plan: true,
        planType: true
      },
      orderBy: { name: 'asc' }
    });

    return tenants.map(t => ({
      id: t.id,
      name: t.name,
      plan: t.planType || t.plan || 'unknown'
    }));
  }

  /**
   * Listar bancos de dados de um tenant específico
   */
  async listDatabasesByTenant(tenantId: string): Promise<DatabaseInstanceWithDetails[]> {
    logger.info('Listing databases for tenant', { tenantId });

    const instances = await this.prisma.databaseInstance.findMany({
      where: { tenantId },
      include: {
        server: {
          select: {
            name: true,
            host: true
          }
        },
        tenant: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return instances.map(instance => ({
      id: instance.id,
      serverId: instance.serverId,
      tenantId: instance.tenantId,
      tenantName: instance.tenant.name,
      serverName: instance.server?.name || null,
      serverHost: instance.server?.host || null,
      provider: instance.provider,
      externalHost: instance.externalHost,
      databaseType: instance.databaseType,
      databaseName: instance.databaseName,
      containerName: instance.containerName,
      port: instance.port,
      username: instance.username,
      schemaName: instance.schemaName,
      status: instance.status,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt
    }));
  }

  /**
   * Validar se tenant tem plano Enterprise ou Custom
   */
  private async validateTenantPlan(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, planType: true, status: true }
    });

    if (!tenant) {
      throw new Error('Tenant not found');
    }

    if (tenant.status !== 'active') {
      throw new Error('Tenant is not active');
    }

    const planValue = tenant.planType || tenant.plan;
    if (planValue !== 'enterprise' && planValue !== 'custom') {
      throw new Error('Only Enterprise and Custom plan tenants can have dedicated databases');
    }
  }

  /**
   * Obter chave SSH do servidor (reutilizando lógica existente)
   */
  private async getServerSSHKey(serverId: string): Promise<string | null> {
    // Reutilizar lógica de admin-database.routes.ts
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    try {
      const encryptedKey = await redis.get(`fitos:servers:sshkey:${serverId}`);
      await redis.quit();

      if (!encryptedKey) return null;

      const decrypted = this.encryptionService.decrypt(encryptedKey);
      return decrypted;
    } catch (error) {
      logger.error('Error decrypting SSH key', { error, serverId });
      try {
        await redis.quit();
      } catch {}
      return null;
    }
  }

  /**
   * Obter porta padrão por tipo de banco
   */
  private getDefaultPort(databaseType: DatabaseType): number {
    switch (databaseType) {
      case 'postgresql':
        return 5432;
      case 'mysql':
        return 3306;
      case 'redis':
        return 6379;
      default:
        return 5432;
    }
  }

  /**
   * Obter username padrão por tipo de banco
   */
  private getDefaultUsername(databaseType: DatabaseType): string {
    switch (databaseType) {
      case 'postgresql':
        return 'postgres';
      case 'mysql':
        return 'root';
      case 'redis':
        return '';
      default:
        return 'postgres';
    }
  }

  /**
   * Sincronizar bancos de dados de provedores externos
   * Cria ou atualiza registros DatabaseInstance para bancos encontrados via API
   */
  async syncExternalProviderDatabases(
    provider: string,
    externalDatabases: Array<{
      id: string;
      name: string;
      host: string;
      port: number;
      database: string;
      username: string;
      password?: string;
      databaseType: 'postgresql' | 'mysql' | 'redis';
      status?: 'active' | 'inactive';
      connectionString?: string;
      projectName?: string;
      region?: string;
    }>,
    userId: string
  ): Promise<number> {
    logger.info('Syncing external provider databases', { 
      provider, 
      count: externalDatabases.length,
      userId 
    });

    let syncedCount = 0;

    // Buscar ou criar tenant "sistema" para bancos globais
    let systemTenant = await this.prisma.tenant.findFirst({
      where: { 
        OR: [
          { name: 'Sistema' },
          { subdomain: 'sistema' }
        ]
      }
    });

    // Se não existir, criar o tenant sistema
    if (!systemTenant) {
      try {
        systemTenant = await this.prisma.tenant.create({
          data: {
            name: 'Sistema',
            subdomain: 'sistema',
            plan: 'unlimited',
            status: 'active',
            billingEmail: 'system@fitos.local',
            planLimits: {
              users: -1,
              clients: -1,
              workouts: -1,
              storage: -1,
              aiRequests: -1
            },
            enabledFeatures: {
              all: true
            },
            settings: {
              superAdmin: true,
              bypassRateLimit: true,
              accessAllTenants: true
            }
          }
        });
        logger.info('Created tenant "Sistema" for external databases', { tenantId: systemTenant.id });
      } catch (error) {
        logger.error('Error creating tenant "Sistema"', { error });
        throw error;
      }
    }

    const defaultTenantId = systemTenant.id;

    for (const db of externalDatabases) {
      try {
        // Mapear databaseType para enum do Prisma (lowercase)
        const databaseType = db.databaseType.toLowerCase() as DatabaseType;
        
        // Verificar se já existe um registro para este banco
        // Para Neon: usar containerName (branchId), para outros: provider + externalHost + databaseName
        const whereClause: any = {
          provider: provider as any,
          databaseType
        };
        
        if (provider === 'neon') {
          // Para Neon, buscar por branchId que é armazenado no containerName
          whereClause.containerName = {
            startsWith: `${db.id}|`
          };
        } else {
          whereClause.externalHost = db.host;
          whereClause.databaseName = db.database || db.name;
        }
        
        const existing = await this.prisma.databaseInstance.findFirst({
          where: whereClause
        });

        // Preparar dados para criar/atualizar
        const instanceData: any = {
          tenantId: defaultTenantId,
          databaseType,
          databaseName: db.database || db.name,
          provider: provider as any,
          // Converter 'N/A' para null para branches inativas do Neon
          externalHost: db.host && db.host !== 'N/A' ? db.host : null,
          port: db.port,
          username: db.username,
          status: ((db.status || 'active') === 'active' ? 'active' : 'inactive') as DatabaseInstanceStatus,
          serverId: null,
          // Para Neon: formato "branchId|projectId", para outros: usar projectName
          containerName: provider === 'neon' ? `${db.id}|${db.region}` : (db.projectName || null),
          schemaName: null
        };

        // Criptografar senha se fornecida
        if (db.password) {
          instanceData.encryptedPassword = this.encryptionService.encrypt(db.password);
        }

        if (existing) {
          // Atualizar registro existente
          await this.prisma.databaseInstance.update({
            where: { id: existing.id },
            data: instanceData
          });
          logger.debug('Updated external database instance', { 
            instanceId: existing.id, 
            provider, 
            host: db.host 
          });
        } else {
          // Criar novo registro
          await this.prisma.databaseInstance.create({
            data: instanceData
          });
          logger.debug('Created external database instance', { 
            provider, 
            host: db.host, 
            database: db.database 
          });
        }

        syncedCount++;
      } catch (error) {
        logger.error('Error syncing external database', { 
          provider, 
          database: db.name, 
          error 
        });
        // Continua com o próximo banco mesmo se um falhar
      }
    }

    logger.info('External databases sync completed', { 
      provider, 
      total: externalDatabases.length, 
      synced: syncedCount 
    });

    return syncedCount;
  }

  /**
   * Gerar senha aleatória segura
   */
  private generatePassword(): string {
    const length = 24;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

