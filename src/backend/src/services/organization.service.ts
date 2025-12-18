import { PrismaClient, PlanType, DbStrategy, DatabaseProvider } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { ConnectionManagerService, connectionManager } from './connection-manager.service';
import { BackupService } from './backup.service';
import { MigrationOrchestratorService } from './migration-orchestrator.service';
import { ProviderIntegrationService, ProvisionedDatabase } from './provider-integration.service';
import { EncryptionService } from './encryption.service';

export interface CreateOrganizationData {
  name: string;
  subdomain?: string;
  planType: PlanType;
  customDomain?: string;
  settings?: Record<string, any>;
}

export interface UpgradePlanData {
  newPlanType: PlanType;
  createBackup?: boolean;
}

/**
 * Organization Service
 * Gerencia criação, upgrade e exclusão de organizações
 */
export class OrganizationService {
  private prisma: PrismaClient;
  private connectionManager: ConnectionManagerService;
  private backupService: BackupService;
  private migrationOrchestrator: MigrationOrchestratorService;
  private providerIntegration: ProviderIntegrationService;
  private encryptionService: EncryptionService;

  constructor() {
    this.prisma = getPrismaClient();
    this.connectionManager = connectionManager;
    this.backupService = new BackupService();
    this.migrationOrchestrator = new MigrationOrchestratorService();
    this.providerIntegration = new ProviderIntegrationService();
    this.encryptionService = new EncryptionService();
    logger.info('OrganizationService initialized');
  }

  /**
   * Cria uma nova organização baseada no plano
   */
  async createOrganization(data: CreateOrganizationData): Promise<any> {
    logger.info(`Creating organization: ${data.name} with plan ${data.planType}`);

    // Determinar estratégia baseada no plano
    const dbStrategy = this.getDbStrategyForPlan(data.planType);

    // Criar tenant na base de dados principal (row-level por padrão)
    const tenant = await this.prisma.tenant.create({
      data: {
        name: data.name,
        subdomain: data.subdomain,
        customDomain: data.customDomain,
        planType: data.planType,
        dbStrategy,
        status: 'active',
        settings: data.settings || {},
        billingEmail: `${(data.subdomain || data.name).toLowerCase().replace(/\s+/g, '')}@example.com`,
      },
    });

    logger.info(`Created tenant ${tenant.id} with strategy ${dbStrategy}`);

    // Se for schema-level ou database-level, provisionar recursos dedicados
    if (dbStrategy === 'schema_level') {
      await this.provisionSchemaLevelTenant(tenant.id);
    } else if (dbStrategy === 'database_level') {
      await this.provisionDatabaseLevelTenant(tenant.id, data.planType);
    }

    return tenant;
  }

  /**
   * Atualiza o plano de uma organização
   */
  async upgradeOrganizationPlan(
    organizationId: string,
    upgradeData: UpgradePlanData
  ): Promise<any> {
    logger.info(`Upgrading organization ${organizationId} to plan ${upgradeData.newPlanType}`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: organizationId },
      select: { planType: true, dbStrategy: true },
    });

    if (!tenant) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const newDbStrategy = this.getDbStrategyForPlan(upgradeData.newPlanType);
    const oldDbStrategy = tenant.dbStrategy;

    // Se estratégia mudou, precisa migrar
    if (oldDbStrategy !== newDbStrategy) {
      logger.info(`Strategy change required: ${oldDbStrategy} → ${newDbStrategy}`);

      // Criar backup antes da mudança se solicitado
      if (upgradeData.createBackup !== false) {
        logger.info('Creating backup before migration...');
        await this.backupService.createBackup(organizationId, 'pre_migration', 'local');
      }

      // Executar migração entre estratégias
      await this.migrationOrchestrator.migrateOrganization(
        organizationId,
        oldDbStrategy,
        newDbStrategy
      );
    }

    // Atualizar plano (mesmo que estratégia não tenha mudado)
    const updated = await this.prisma.tenant.update({
      where: { id: organizationId },
      data: {
        planType: upgradeData.newPlanType,
        dbStrategy: newDbStrategy,
        updatedAt: new Date(),
      },
    });

    logger.info(`✅ Organization ${organizationId} upgraded to ${upgradeData.newPlanType}`);
    return updated;
  }

  /**
   * Deleta uma organização e limpa todos os dados
   */
  async deleteOrganization(organizationId: string, force: boolean = false): Promise<void> {
    logger.warn(`Deleting organization ${organizationId} (force: ${force})`);

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: organizationId },
      select: { dbStrategy: true },
    });

    if (!tenant) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    // Criar backup antes de deletar (se não for force)
    if (!force) {
      logger.info('Creating backup before deletion...');
      await this.backupService.createBackup(organizationId, 'manual', 'local');
    }

    // Limpar dados baseado na estratégia
    switch (tenant.dbStrategy) {
      case 'row_level':
        // No row-level, apenas deletar registros (soft delete)
        await this.prisma.tenant.update({
          where: { id: organizationId },
          data: { status: 'inactive' },
        });
        break;

      case 'schema_level':
        // No schema-level, deletar schema dedicado
        await this.deleteSchemaLevelTenant(organizationId);
        break;

      case 'database_level':
        // No database-level, deletar database dedicado
        await this.deleteDatabaseLevelTenant(organizationId);
        break;
    }

    // Deletar registro do tenant (se force)
    if (force) {
      await this.prisma.tenant.delete({
        where: { id: organizationId },
      });
      logger.info(`✅ Organization ${organizationId} deleted permanently`);
    } else {
      logger.info(`✅ Organization ${organizationId} soft deleted`);
    }
  }

  /**
   * Determina estratégia de database baseada no plano
   */
  private getDbStrategyForPlan(planType: PlanType): DbStrategy {
    switch (planType) {
      case 'individual':
      case 'professional':
      case 'business':
        return 'row_level';
      case 'enterprise':
        return 'schema_level';
      case 'custom':
        return 'database_level';
      default:
        return 'row_level';
    }
  }

  /**
   * Provisiona recursos para schema-level tenant
   */
  private async provisionSchemaLevelTenant(organizationId: string): Promise<void> {
    logger.info(`Provisioning schema-level tenant: ${organizationId}`);

    const schemaName = `tenant_${organizationId.replace(/-/g, '_')}`;

    // Criar schema no banco principal
    const prisma = await this.connectionManager.getConnection(organizationId);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    // Executar migrations no schema dedicado
    // (As migrations do Prisma precisam ser adaptadas para schema-level)
    logger.info(`Created schema ${schemaName} for tenant ${organizationId}`);
  }

  /**
   * Provisiona database dedicado para database-level tenant
   */
  private async provisionDatabaseLevelTenant(
    organizationId: string,
    planType: PlanType
  ): Promise<void> {
    logger.info(`Provisioning database-level tenant: ${organizationId}`);

    // Escolher provider disponível dinamicamente respeitando ordem de preferência
    const preferredProviders: DatabaseProvider[] = ['neon', 'railway', 'supabase', 'aws_rds'];

    let provisioned: ProvisionedDatabase | null = null;
    let chosenProvider: DatabaseProvider | null = null;

    for (const provider of preferredProviders) {
      // Verifica se temos credenciais/config para este provider
      const ok = await this.providerIntegration.testProviderConnection(provider);
      if (!ok) {
        continue;
      }
      try {
        const name = `tenant_${organizationId.substring(0, 8)}`;
        switch (provider) {
          case 'neon':
            provisioned = await this.providerIntegration.provisionNeonDatabase({ name });
            break;
          case 'railway':
            provisioned = await this.providerIntegration.provisionRailwayDatabase({ name });
            break;
          case 'supabase':
            provisioned = await this.providerIntegration.provisionSupabaseDatabase({ name });
            break;
          case 'aws_rds':
            provisioned = await this.providerIntegration.provisionAWSRDSDatabase({ name });
            break;
          default:
            break;
        }
        if (provisioned) {
          chosenProvider = provider;
          break;
        }
      } catch (err) {
        logger.warn(`Provider ${provider} failed to provision DB: ${err instanceof Error ? err.message : 'unknown error'}`);
        // tenta próximo provider
      }
    }

    if (!provisioned || !chosenProvider) {
      throw new Error('No database provider available for provisioning');
    }

    // Persistir conexão com criptografia de secrets
    const encryptedPassword = provisioned.password
      ? this.encryptionService.encrypt(provisioned.password)
      : null;

    const connection = await this.prisma.databaseConnection.create({
      data: {
        organizationId,
        name: `${chosenProvider}-primary`,
        provider: chosenProvider,
        host: provisioned.host,
        port: provisioned.port,
        databaseName: provisioned.databaseName,
        username: provisioned.username,
        encryptedPassword,
        sslEnabled: true,
        connectionPoolSize: 10,
        status: 'active',
      },
    });

    logger.info(`Database connection created: ${connection.id} for org ${organizationId}`);

    // Atualizar estratégia da organização para database_level
    await this.prisma.tenant.update({
      where: { id: organizationId },
      data: { dbStrategy: 'database_level', updatedAt: new Date() },
    });

    logger.info(`✅ Organization ${organizationId} set to database_level using provider ${chosenProvider}`);
  }

  /**
   * Deleta schema dedicado para schema-level tenant
   */
  private async deleteSchemaLevelTenant(organizationId: string): Promise<void> {
    const schemaName = `tenant_${organizationId.replace(/-/g, '_')}`;
    const prisma = await this.connectionManager.getConnection(organizationId);

    // Deletar schema (CASCADE remove todas as tabelas)
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);

    logger.info(`Deleted schema ${schemaName} for tenant ${organizationId}`);
  }

  /**
   * Deleta database dedicado para database-level tenant
   */
  private async deleteDatabaseLevelTenant(organizationId: string): Promise<void> {
    // TODO: Implementar deleção via ProviderIntegrationService
    // Por enquanto, apenas marcar conexão como inativa
    await this.prisma.databaseConnection.updateMany({
      where: { organizationId },
      data: { status: 'inactive' },
    });

    logger.warn('Database deletion needs to be done manually or via ProviderIntegrationService');
  }
}

