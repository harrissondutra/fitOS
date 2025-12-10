import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';

/**
 * MultiSchemaMigrationService
 * Rotinas para aplicar DDL idempotente e sincronizar estrutura em todos os schemas tenant_*
 */
export class MultiSchemaMigrationService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Lista todos os schemas de tenants (tenant_*) existentes
   */
  async listTenantSchemas(): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<Array<{ nspname: string }>>`
      SELECT nspname FROM pg_namespace
      WHERE nspname LIKE 'tenant_%'
      ORDER BY nspname
    `;
    return rows.map(r => r.nspname);
  }

  /**
   * Aplica um bloco DDL idempotente em todos os schemas tenant_*
   * Observação: o DDL deve ser seguro para EXECUTE, preferir CREATE IF NOT EXISTS / ALTER IF EXISTS
   */
  async applyDDLToAllSchemas(ddlTemplate: (schema: string) => string): Promise<void> {
    const schemas = await this.listTenantSchemas();
    for (const schema of schemas) {
      const ddl = ddlTemplate(schema);
      logger.info(`Applying DDL to schema ${schema}`);
      await this.prisma.$executeRawUnsafe(ddl);
    }
  }

  /**
   * Sincroniza estrutura de tabelas com tenant_id do schema fitos para todos schemas tenant_*
   * Cria tabelas faltantes via CREATE TABLE schema.table LIKE fitos.table INCLUDING ALL INCLUDING INDEXES
   */
  async syncStructureFromFitosToAllTenantSchemas(): Promise<void> {
    const schemas = await this.listTenantSchemas();
    const tables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id'
      WHERE c.relkind = 'r' AND n.nspname = 'fitos'
    `;

    for (const schema of schemas) {
      for (const t of tables) {
        const src = `fitos.${t.table_name}`;
        const dst = `${schema}.${t.table_name}`;
        await this.prisma.$executeRawUnsafe(
          `DO $$ BEGIN IF NOT EXISTS (
             SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE c.relname='${t.table_name.replace(/'/g, "''")}' AND n.nspname='${schema.replace(/'/g, "''")}') THEN
             EXECUTE 'CREATE TABLE ${dst} (LIKE ${src} INCLUDING ALL INCLUDING INDEXES)';
           END IF; END $$;`
        );
      }
    }
  }
}

export const multiSchemaMigrationService = new MultiSchemaMigrationService();



