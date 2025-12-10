/**
 * StorageCostTrackerService - Rastreamento de Custos de Armazenamento
 * 
 * Integra com CloudinaryCostTrackerService para:
 * - Rastrear uploads automaticamente (já feito pelo CloudinaryService)
 * - Sincronizar uso mensal da API Cloudinary
 * - Registrar custos no CostEntry
 */

import { CostTrackerService } from './cost-tracker.service';
import { CloudinaryCostTrackerService, cloudinaryCostTracker } from './cloudinary-cost-tracker.service';
import { logger } from '../utils/logger';

export interface StorageUsageData {
  storageGB: number;
  bandwidthGB: number;
  transformations: number;
  metadata?: any;
}

export class StorageCostTrackerService {
  private costTracker: CostTrackerService;
  private cloudinaryTracker: CloudinaryCostTrackerService;

  constructor() {
    this.costTracker = new CostTrackerService();
    this.cloudinaryTracker = cloudinaryCostTracker;
  }

  /**
   * Rastrear upload individual
   * Já chamado automaticamente pelo CloudinaryService após cada upload
   */
  async trackUpload(data: {
    bytes: number;
    type: string;
    metadata?: any;
    tenantId?: string;
    clientId?: string;
    createdBy?: string;
  }): Promise<void> {
    try {
      const { bytes, type, metadata, tenantId, clientId, createdBy } = data;
      const sizeMB = bytes / (1024 * 1024);

      // Rastrear via CostTrackerService (já calcula custo baseado no pricing model)
      await this.costTracker.trackUsage({
        categoryName: 'storage',
        serviceName: 'cloudinary',
        usage: {
          quantity: 1,
          unit: 'upload',
          metadata: {
            sizeMB,
            sizeBytes: bytes,
            type,
            ...metadata,
          },
        },
        tenantId,
        clientId,
        createdBy,
      });

      logger.debug(`Tracked storage upload: ${sizeMB.toFixed(2)}MB of type ${type}`);
    } catch (error) {
      logger.error('Error tracking storage upload:', error);
      // Não lançar erro para não quebrar o fluxo
    }
  }

  /**
   * Sincronizar uso mensal da API Cloudinary e registrar custos agregados
   * Deve ser executado via job diário/mensal
   */
  async syncMonthlyUsage(): Promise<void> {
    try {
      logger.info('Starting monthly storage usage sync from Cloudinary API');

      // Buscar dados de uso da API Cloudinary
      const usageData = await this.cloudinaryTracker.getUsageStats();

      // Calcular custos totais
      const totalCost = usageData.cost;
      const currency = usageData.currency;

      if (totalCost <= 0) {
        logger.debug('No storage costs to sync (cost is zero or negative)');
        return;
      }

      // Registrar entrada mensal agregada
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Usar trackUsageWithCost para registrar custo já calculado
      await this.costTracker.trackUsageWithCost({
        categoryName: 'storage',
        serviceName: 'cloudinary',
        cost: totalCost,
        currency,
        usage: {
          quantity: 1,
          unit: 'monthly_sync',
          metadata: {
            month,
            year,
            storageGB: usageData.usage.storage.used / (1024 * 1024 * 1024),
            bandwidthGB: usageData.usage.bandwidth.used / (1024 * 1024 * 1024),
            transformations: usageData.usage.transformations.used,
            credits: usageData.usage.credits.usage,
            lastSyncAt: usageData.lastUpdated.toISOString(),
          },
        },
      });

      logger.info(
        `Monthly storage usage synced: ${currency} ${totalCost.toFixed(2)} for ${month}/${year}`
      );
    } catch (error) {
      logger.error('Error syncing monthly storage usage:', error);
      throw error;
    }
  }

  /**
   * Estimar custo baseado em tamanho e operações
   */
  async estimateUploadCost(bytes: number, hasTransformations: boolean = false): Promise<number> {
    const sizeGB = bytes / (1024 * 1024 * 1024);
    const costPerGBStorage = parseFloat(process.env.COST_STORAGE_PER_GB || '0.10');
    const costPerTransformation = parseFloat(process.env.COST_CLOUDINARY_PER_TRANSFORMATION || '0.0018');

    let cost = sizeGB * costPerGBStorage;

    if (hasTransformations) {
      // Estimativa: 1 transformação por upload
      cost += costPerTransformation;
    }

    return cost;
  }
}
