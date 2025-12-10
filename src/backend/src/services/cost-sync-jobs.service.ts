/**
 * CostSyncJobsService - Jobs de Sincronização de Custos
 * 
 * Jobs agendados para sincronizar custos:
 * - Diário: Storage (Cloudinary)
 * - Mensal: Database (PostgreSQL/Redis)
 */

import { logger } from '../utils/logger';
import { StorageCostTrackerService } from './storage-cost-tracker.service';
import { DatabaseCostTrackerService } from './database-cost-tracker.service';

export class CostSyncJobsService {
  private storageTracker: StorageCostTrackerService;
  private databaseTracker: DatabaseCostTrackerService;

  constructor() {
    this.storageTracker = new StorageCostTrackerService();
    this.databaseTracker = new DatabaseCostTrackerService();
  }

    /**
   * Job diário: Sincronizar custos de storage (Cloudinary)
   * Executa todo dia às 3:00 AM
   */
  async syncDailyStorageCosts(): Promise<void> {
    try {
      logger.info('Starting daily storage costs sync job');

      await this.storageTracker.syncMonthlyUsage();

      logger.info('Daily storage costs sync job completed successfully');       
    } catch (error) {
      logger.error('Error in daily storage costs sync job:', error);
      throw error;
    }
  }

  /**
   * Job mensal: Sincronizar custos de database
   * Executa no primeiro dia do mês às 4:00 AM
   */
  async syncMonthlyDatabaseCosts(): Promise<void> {
    try {
      logger.info('Starting monthly database costs sync job');

      await this.databaseTracker.syncMonthlyDatabaseCosts();

      logger.info('Monthly database costs sync job completed successfully');
    } catch (error) {
      logger.error('Error in monthly database costs sync job:', error);
      throw error;
    }
  }

  /**
   * Executar sync manual de storage (para testes)
   */
  async manualStorageSync(): Promise<void> {
    return this.syncDailyStorageCosts();
  }

  /**
   * Executar sync manual de database (para testes)
   */
  async manualDatabaseSync(): Promise<void> {
    return this.syncMonthlyDatabaseCosts();
  }
}

// Exportar instância singleton
export const costSyncJobs = new CostSyncJobsService();
