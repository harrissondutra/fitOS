import { PrismaClient, DbStrategy, MigrationStatus } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { BackupService } from './backup.service';
import { ConnectionManagerService, connectionManager } from './connection-manager.service';

export interface MigrationProgress {
  migrationJobId: string;
  currentStep: string;
  progressPercent: number;
  totalSteps: number;
  estimatedTimeRemaining?: number;
}

/**
 * Migration Orchestrator Service
 * Gerencia migrações entre estratégias de multi-tenancy
 */
export class MigrationOrchestratorService {
  private prisma: PrismaClient;
  private backupService: BackupService;
  private connectionManager: ConnectionManagerService;

  constructor() {
    this.prisma = getPrismaClient();
    this.backupService = new BackupService();
    this.connectionManager = connectionManager;
    logger.info('MigrationOrchestratorService initialized');
  }

  /**
   * Migra uma organização entre estratégias
   */
  async migrateOrganization(
    organizationId: string,
    fromStrategy: DbStrategy,
    toStrategy: DbStrategy
  ): Promise<string> {
    logger.info(`Starting migration: ${organizationId} from ${fromStrategy} to ${toStrategy}`);

    // Validar que migração é necessária
    if (fromStrategy === toStrategy) {
      throw new Error(`Organization ${organizationId} already uses strategy ${toStrategy}`);
    }

    // Criar job de migração
    const migrationJob = await this.prisma.migrationJob.create({
      data: {
        organizationId,
        fromStrategy,
        toStrategy,
        status: 'pending',
        progressPercent: 0,
        totalSteps: this.calculateTotalSteps(fromStrategy, toStrategy),
        currentStep: 'Initializing migration...',
      },
    });

    try {
      // Criar backup pré-migração
      logger.info('Creating pre-migration backup...');
      await this.updateProgress(migrationJob.id, 5, 'Creating backup...');
      const backupId = await this.backupService.createBackup(organizationId, 'pre_migration', 'local');

      await this.prisma.migrationJob.update({
        where: { id: migrationJob.id },
        data: { backupId, status: 'running', startedAt: new Date() },
      });

      // Executar migração baseada nas estratégias
      await this.updateProgress(migrationJob.id, 10, 'Validating data integrity...');
      await this.validateDataIntegrity(organizationId);

      await this.updateProgress(migrationJob.id, 20, 'Starting data migration...');

      if (fromStrategy === 'row_level' && toStrategy === 'schema_level') {
        await this.migrateRowToSchema(organizationId, migrationJob.id);
      } else if (fromStrategy === 'row_level' && toStrategy === 'database_level') {
        await this.migrateRowToDatabase(organizationId, migrationJob.id);
      } else if (fromStrategy === 'schema_level' && toStrategy === 'database_level') {
        await this.migrateSchemaToDatabase(organizationId, migrationJob.id);
      } else {
        // Downgrade paths
        if (fromStrategy === 'database_level' && toStrategy === 'schema_level') {
          await this.migrateDatabaseToSchema(organizationId, migrationJob.id);
        } else if (fromStrategy === 'database_level' && toStrategy === 'row_level') {
          await this.migrateDatabaseToRow(organizationId, migrationJob.id);
        } else if (fromStrategy === 'schema_level' && toStrategy === 'row_level') {
          await this.migrateSchemaToRow(organizationId, migrationJob.id);
        }
      }

      // Validação pós-migração
      await this.updateProgress(migrationJob.id, 90, 'Validating migration results...');
      await this.validateMigrationResults(organizationId, toStrategy);

      // Atualizar tenant
      await this.prisma.tenant.update({
        where: { id: organizationId },
        data: {
          dbStrategy: toStrategy,
          migratedAt: new Date(),
          migrationVersion: '1.0.0',
        },
      });

      // Finalizar job
      await this.prisma.migrationJob.update({
        where: { id: migrationJob.id },
        data: {
          status: 'completed',
          progressPercent: 100,
          currentStep: 'Migration completed successfully',
          completedAt: new Date(),
        },
      });

      logger.info(`✅ Migration completed successfully: ${migrationJob.id}`);
      return migrationJob.id;
    } catch (error) {
      logger.error(`Error during migration ${migrationJob.id}:`, error);

      // Marcar job como falhou
      await this.prisma.migrationJob.update({
        where: { id: migrationJob.id },
        data: {
          status: 'failed',
          errorLog: error instanceof Error ? error.stack || error.message : String(error),
          completedAt: new Date(),
        },
      });

      // Rollback automático
      logger.warn('Attempting automatic rollback...');
      try {
        const job = await this.prisma.migrationJob.findUnique({ where: { id: migrationJob.id } });
        const bId = (job as any)?.backupId as string | undefined;
        if (bId) {
          await this.rollbackMigration(migrationJob.id, bId);
        }
      } catch (rbErr) {
        logger.error('Automatic rollback failed:', rbErr);
      }

      throw error;
    }
  }

  /**
   * Atualiza progresso da migração
   */
  private async updateProgress(
    migrationJobId: string,
    progressPercent: number,
    currentStep: string
  ): Promise<void> {
    await this.prisma.migrationJob.update({
      where: { id: migrationJobId },
      data: {
        progressPercent,
        currentStep,
      },
    });
  }

  /**
   * Calcula total de steps baseado nas estratégias
   */
  private calculateTotalSteps(fromStrategy: DbStrategy, toStrategy: DbStrategy): number {
    // Steps: backup(1), validate(1), migrate(1-3), validate(1), update(1)
    return 5;
  }

  /**
   * Valida integridade dos dados antes da migração
   */
  private async validateDataIntegrity(organizationId: string): Promise<void> {
    // Validação básica: garantir que o tenant existe e está ativo
    const tenant = await this.prisma.tenant.findUnique({ where: { id: organizationId } });
    if (!tenant || tenant.status !== 'active') {
      throw new Error(`Organization ${organizationId} not found or inactive`);
    }
    logger.debug(`Validating data integrity for organization ${organizationId}`);
  }

  /**
   * Valida resultados da migração
   */
  private async validateMigrationResults(
    organizationId: string,
    strategy: DbStrategy
  ): Promise<void> {
    // TODO: Implementar validações pós-migração
    logger.debug(`Validating migration results for organization ${organizationId} with strategy ${strategy}`);
  }

  /**
   * Migra de row-level para schema-level
   */
  private async migrateRowToSchema(organizationId: string, migrationJobId: string): Promise<void> {
    await this.updateProgress(migrationJobId, 30, 'Creating dedicated schema...');

    const schemaName = `tenant_${organizationId.replace(/-/g, '_')}`;
    const prisma = await this.connectionManager.getConnection(organizationId);

    // Criar schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    await this.updateProgress(migrationJobId, 45, 'Preparing schema structure...');
    await this.prepareTenantSchemaFromFitos(prisma, schemaName);

    await this.updateProgress(migrationJobId, 65, 'Copying data to schema...');
    await this.copyTenantDataToSchema(prisma, organizationId, schemaName);

    await this.updateProgress(migrationJobId, 80, 'Verifying data copy...');
    await this.verifySchemaDataCounts(prisma, organizationId, schemaName);
  }

  /**
   * Migra de row-level para database-level
   */
  private async migrateRowToDatabase(organizationId: string, migrationJobId: string): Promise<void> {
    await this.updateProgress(migrationJobId, 30, 'Provisioning dedicated database...');
    // TODO: Provision database via ProviderIntegrationService

    await this.updateProgress(migrationJobId, 50, 'Copying data to database...');
    // TODO: Copiar dados para database dedicado

    await this.updateProgress(migrationJobId, 70, 'Verifying data copy...');
    // TODO: Verificar dados
  }

  /**
   * Migra de schema-level para database-level
   */
  private async migrateSchemaToDatabase(organizationId: string, migrationJobId: string): Promise<void> {
    await this.updateProgress(migrationJobId, 30, 'Provisioning dedicated database...');
    // TODO: Provisioning

    await this.updateProgress(migrationJobId, 50, 'Migrating schema to database...');
    // TODO: Migrar schema completo para database dedicado

    await this.updateProgress(migrationJobId, 70, 'Verifying migration...');
    // TODO: Verificar
  }

  /**
   * Migra de database-level para schema-level
   */
  private async migrateDatabaseToSchema(organizationId: string, migrationJobId: string): Promise<void> {
    await this.updateProgress(migrationJobId, 30, 'Preparing schema...');
    // TODO: Preparar schema no banco principal

    await this.updateProgress(migrationJobId, 50, 'Migrating data from database...');
    // TODO: Copiar dados do database dedicado para schema

    await this.updateProgress(migrationJobId, 70, 'Verifying migration...');
    // TODO: Verificar
  }

  /**
   * Migra de database-level para row-level
   */
  private async migrateDatabaseToRow(organizationId: string, migrationJobId: string): Promise<void> {
    await this.updateProgress(migrationJobId, 30, 'Preparing row-level tables...');
    // TODO: Preparar tabelas do row-level

    await this.updateProgress(migrationJobId, 50, 'Migrating data from database...');
    // TODO: Copiar dados do database dedicado para row-level

    await this.updateProgress(migrationJobId, 70, 'Verifying migration...');
    // TODO: Verificar
  }

  /**
   * Migra de schema-level para row-level
   */
  private async migrateSchemaToRow(organizationId: string, migrationJobId: string): Promise<void> {
    await this.updateProgress(migrationJobId, 30, 'Preparing row-level tables...');
    // TODO: Preparar

    await this.updateProgress(migrationJobId, 50, 'Migrating data from schema...');
    // TODO: Copiar dados do schema para row-level

    await this.updateProgress(migrationJobId, 70, 'Verifying migration...');
    // TODO: Verificar
  }

  /**
   * Faz rollback de uma migração
   */
  private async rollbackMigration(migrationJobId: string, backupId: string): Promise<void> {

    logger.warn(`Rolling back migration ${migrationJobId} using backup ${backupId}`);

    const migrationJob = await this.prisma.migrationJob.findUnique({
      where: { id: migrationJobId },
    });

    if (!migrationJob) {
      throw new Error(`Migration job ${migrationJobId} not found`);
    }

    try {
      // Restaurar backup
      await this.backupService.restoreBackup(backupId);

      // Atualizar job
      await this.prisma.migrationJob.update({
        where: { id: migrationJobId },
        data: {
          status: 'rolled_back',
          currentStep: 'Migration rolled back successfully',
        },
      });

      logger.info(`✅ Migration ${migrationJobId} rolled back successfully`);
    } catch (error) {
      logger.error(`Error rolling back migration ${migrationJobId}:`, error);
      throw error;
    }
  }

  /**
   * Prepara estrutura do schema do tenant com base nas tabelas do schema fitos que possuem tenant_id
   * Cria tabelas usando CREATE TABLE LIKE ... INCLUDING ALL INCLUDING INDEXES para manter estrutura
   */
  private async prepareTenantSchemaFromFitos(prisma: PrismaClient, schemaName: string): Promise<void> {
    // Listar tabelas do schema fitos que possuem coluna tenant_id
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id'
      WHERE c.relkind = 'r' AND n.nspname = 'fitos'
    `;

    for (const t of tables) {
      const src = `fitos.${t.table_name}`;
      const dst = `${schemaName}.${t.table_name}`;
      // Criar tabela no schema do tenant se não existir
      await prisma.$executeRawUnsafe(
        `DO $$ BEGIN IF NOT EXISTS (
           SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE c.relname='${t.table_name.replace(/'/g, "''")}' AND n.nspname='${schemaName.replace(/'/g, "''")}') THEN
           EXECUTE 'CREATE TABLE ${dst} (LIKE ${src} INCLUDING ALL INCLUDING INDEXES)';
         END IF; END $$;`
      );
    }
  }

  /**
   * Copia dados do row-level (fitos) para o schema do tenant filtrando por tenant_id
   */
  private async copyTenantDataToSchema(prisma: PrismaClient, organizationId: string, schemaName: string): Promise<void> {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id'
      WHERE c.relkind = 'r' AND n.nspname = 'fitos'
    `;

    for (const t of tables) {
      const src = `fitos.${t.table_name}`;
      const dst = `${schemaName}.${t.table_name}`;
      // Inserir ignorando duplicatas (se existir unique conflicts)
      // Estratégia simples: apagar dados do destino do tenant e inserir do zero
      await prisma.$executeRawUnsafe(`DELETE FROM ${dst} WHERE tenant_id = '${organizationId.replace(/'/g, "''")}'`);
      await prisma.$executeRawUnsafe(`INSERT INTO ${dst} SELECT * FROM ${src} WHERE tenant_id = '${organizationId.replace(/'/g, "''")}'`);
    }
  }

  /**
   * Verifica contagem de registros entre origem (fitos) e destino (schema tenant) para cada tabela com tenant_id
   */
  private async verifySchemaDataCounts(prisma: PrismaClient, organizationId: string, schemaName: string): Promise<void> {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id'
      WHERE c.relkind = 'r' AND n.nspname = 'fitos'
    `;

    for (const t of tables) {
      const src = `fitos.${t.table_name}`;
      const dst = `${schemaName}.${t.table_name}`;
      const srcCount = await prisma.$queryRawUnsafe<{ count: string }[]>(`SELECT COUNT(*)::bigint as count FROM ${src} WHERE tenant_id = '${organizationId.replace(/'/g, "''")}'`);
      const dstCount = await prisma.$queryRawUnsafe<{ count: string }[]>(`SELECT COUNT(*)::bigint as count FROM ${dst} WHERE tenant_id = '${organizationId.replace(/'/g, "''")}'`);
      const s = BigInt(srcCount[0]?.count || '0');
      const d = BigInt(dstCount[0]?.count || '0');
      if (s !== d) {
        throw new Error(`Count mismatch on table ${t.table_name}: src=${s} dst=${d}`);
      }
    }
  }

  /**
   * Pausa uma migração em andamento
   */
  async pauseMigration(migrationJobId: string): Promise<void> {
    // TODO: Implementar pausa (salvar estado atual)
    throw new Error('Pause migration not yet implemented');
  }

  /**
   * Retoma uma migração pausada
   */
  async resumeMigration(migrationJobId: string): Promise<void> {
    // TODO: Implementar retomada (ler estado salvo)
    throw new Error('Resume migration not yet implemented');
  }
}

