import { PrismaClient, BackupType, BackupStatus, BackupStorageProvider } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export interface BackupOptions {
  organizationId: string;
  type: BackupType;
  storageProvider: BackupStorageProvider;
  includeMetadata?: boolean;
}

/**
 * Backup Service
 * Gerencia criação e restauração de backups
 */
export class BackupService {
  private prisma: PrismaClient;
  private s3Client: S3Client | null = null;

  constructor() {
    this.prisma = getPrismaClient();
    
    // Inicializar S3 client se credenciais estiverem disponíveis
    if (process.env.AWS_S3_ACCESS_KEY_ID && process.env.AWS_S3_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_S3_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
        },
      });
    }

    logger.info('BackupService initialized');
  }

  /**
   * Cria um backup de uma organização
   */
  async createBackup(
    organizationId: string,
    type: BackupType,
    storageProvider: BackupStorageProvider,
    options?: { includeMetadata?: boolean }
  ): Promise<string> {
    logger.info(`Creating backup for organization ${organizationId}, type: ${type}, provider: ${storageProvider}`);

    // Criar registro de backup
    const backupRecord = await (this.prisma as any).backupHistory.create({
      data: {
        tenantId: organizationId,
        backupType: type,
        storageProvider,
        status: 'in_progress',
        startedAt: new Date(),
      } as any,
    });

    try {
      // Executar backup baseado no provider
      let backupPath: string;
      let backupSizeBytes: number;

      switch (storageProvider) {
        case 'local':
          ({ path: backupPath, size: backupSizeBytes } = await this.createLocalBackup(organizationId, type));
          break;
        case 's3':
          ({ path: backupPath, size: backupSizeBytes } = await this.createS3Backup(organizationId, type, backupRecord.id));
          break;
        case 'supabase_storage':
          ({ path: backupPath, size: backupSizeBytes } = await this.createSupabaseBackup(organizationId, type, backupRecord.id));
          break;
        case 'neon_backup':
          ({ path: backupPath, size: backupSizeBytes } = await this.createNeonBackup(organizationId, type, backupRecord.id));
          break;
        default:
          throw new Error(`Unsupported storage provider: ${storageProvider}`);
      }

      // Atualizar registro de backup
      await (this.prisma as any).backupHistory.update({
        where: { id: backupRecord.id },
        data: {
          status: 'completed',
          backupPath,
          backupSizeBytes,
          completedAt: new Date(),
          ...(storageProvider === 's3' && {
            s3Bucket: process.env.AWS_S3_BUCKET,
            s3Key: backupPath,
          }),
        } as any,
      });

      // Atualizar lastBackupAt no tenant
      await this.prisma.tenant.update({
        where: { id: organizationId },
        data: { lastBackupAt: new Date() },
      });

      logger.info(`✅ Backup created successfully: ${backupRecord.id}`);
      return backupRecord.id;
    } catch (error) {
      logger.error(`Error creating backup for organization ${organizationId}:`, error);
      
      // Atualizar registro com erro
      await (this.prisma as any).backupHistory.update({
        where: { id: backupRecord.id },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          completedAt: new Date(),
        } as any,
      });

      throw error;
    }
  }

  /**
   * Restaura um backup
   */
  async restoreBackup(backupId: string, targetOrganizationId?: string): Promise<void> {
    logger.info(`Restoring backup ${backupId}`);

    const backup = await this.prisma.backupHistory.findUnique({
      where: { id: backupId },
    });

    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    if (backup.status !== 'completed') {
      throw new Error(`Backup ${backupId} is not completed (status: ${backup.status})`);
    }

    const organizationId = targetOrganizationId || (backup as any).tenantId || (backup as any).organizationId;

    try {
      // Restaurar backup baseado no provider
      switch (backup.storageProvider) {
        case 'local':
          await this.restoreLocalBackup(backup.backupPath!, organizationId);
          break;
        case 's3':
          await this.restoreS3Backup(backup.s3Bucket!, backup.s3Key!, organizationId);
          break;
        case 'supabase_storage':
          await this.restoreSupabaseBackup(backup.backupPath!, organizationId);
          break;
        case 'neon_backup':
          await this.restoreNeonBackup(backup.backupPath!, organizationId);
          break;
        default:
          throw new Error(`Unsupported storage provider: ${backup.storageProvider}`);
      }

      logger.info(`✅ Backup ${backupId} restored successfully to organization ${organizationId}`);
    } catch (error) {
      logger.error(`Error restoring backup ${backupId}:`, error);
      throw error;
    }
  }

  /**
   * Cria backup local
   */
  private async createLocalBackup(organizationId: string, type: BackupType): Promise<{ path: string; size: number }> {
    const backupsDir = path.join(process.cwd(), 'backups', organizationId);
    await fs.mkdir(backupsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${type}-${timestamp}.json`;
    const backupPath = path.join(backupsDir, backupFileName);

    // Exportar dados da organização (simplificado - em produção, usar pg_dump ou similar)
    const data = await this.exportOrganizationData(organizationId);
    
    await fs.writeFile(backupPath, JSON.stringify(data, null, 2), 'utf-8');
    
    const stats = await fs.stat(backupPath);
    return { path: backupPath, size: stats.size };
  }

  /**
   * Cria backup no S3
   */
  private async createS3Backup(
    organizationId: string,
    type: BackupType,
    backupId: string
  ): Promise<{ path: string; size: number }> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized. Check AWS credentials.');
    }

    const bucket = process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error('AWS_S3_BUCKET environment variable not set');
    }

    // Exportar dados
    const data = await this.exportOrganizationData(organizationId);
    const backupContent = JSON.stringify(data, null, 2);
    const backupBuffer = Buffer.from(backupContent, 'utf-8');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/${organizationId}/${backupId}-${type}-${timestamp}.json`;

    // Upload para S3
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: backupBuffer,
        ContentType: 'application/json',
      })
    );

    return { path: key, size: backupBuffer.length };
  }

  /**
   * Cria backup no Supabase Storage (TODO: Implementar)
   */
  private async createSupabaseBackup(
    organizationId: string,
    type: BackupType,
    backupId: string
  ): Promise<{ path: string; size: number }> {
    // TODO: Implementar integração com Supabase Storage
    throw new Error('Supabase Storage backup not yet implemented');
  }

  /**
   * Cria backup no Neon (TODO: Implementar)
   */
  private async createNeonBackup(
    organizationId: string,
    type: BackupType,
    backupId: string
  ): Promise<{ path: string; size: number }> {
    // TODO: Implementar integração com Neon Backup API
    throw new Error('Neon backup not yet implemented');
  }

  /**
   * Restaura backup local
   */
  private async restoreLocalBackup(backupPath: string, organizationId: string): Promise<void> {
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const data = JSON.parse(backupContent);
    
    await this.importOrganizationData(data, organizationId);
  }

  /**
   * Restaura backup do S3
   */
  private async restoreS3Backup(bucket: string, key: string, organizationId: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    const result = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const backupContent = await result.Body!.transformToString();
    const data = JSON.parse(backupContent);
    
    await this.importOrganizationData(data, organizationId);
  }

  /**
   * Restaura backup do Supabase (TODO)
   */
  private async restoreSupabaseBackup(backupPath: string, organizationId: string): Promise<void> {
    throw new Error('Supabase Storage restore not yet implemented');
  }

  /**
   * Restaura backup do Neon (TODO)
   */
  private async restoreNeonBackup(backupPath: string, organizationId: string): Promise<void> {
    throw new Error('Neon restore not yet implemented');
  }

  /**
   * Exporta dados de uma organização
   */
  private async exportOrganizationData(organizationId: string): Promise<any> {
    // Exportar dados principais (simplificado)
    // Em produção, usar pg_dump ou exportar todas as tabelas relacionadas
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: organizationId },
    });

    // TODO: Exportar todos os dados relacionados (users, clients, workouts, etc.)
    return {
      tenant,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Importa dados para uma organização
   */
  private async importOrganizationData(data: any, organizationId: string): Promise<void> {
    // TODO: Implementar importação de dados
    // Precisa validar integridade e limpar dados existentes
    logger.warn('Import organization data not fully implemented');
  }
}

