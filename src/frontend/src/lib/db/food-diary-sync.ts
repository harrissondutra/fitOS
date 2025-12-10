/**
 * Food Diary Sync Service - FitOS
 * 
 * Gerencia sincronização offline de entradas do diário alimentar
 * Salva localmente no IndexedDB e sincroniza com backend quando online
 */

import { getIndexedDB, NutritionData, FoodItem } from './indexed-db';

export interface PendingFoodEntry {
  id: string;
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
  mealType: string;
  consumedAt: Date;
  notes?: string;
  synced: boolean;
  serverId?: string; // ID retornado pelo servidor após sincronização
}

export interface SyncStatus {
  pendingCount: number;
  syncing: boolean;
  lastSyncAt: Date | null;
  error: string | null;
}

export class FoodDiarySyncService {
  private db = getIndexedDB();
  private STORE_NAME = 'foodDiaryPending';
  private SYNC_STATUS_KEY = 'foodDiarySyncStatus';

  /**
   * Inicializar service
   */
  async init(): Promise<void> {
    if (!this.db) {
      await this.db.init();
    }
  }

  /**
   * Adicionar entrada pendente ao IndexedDB
   */
  async addPendingEntry(entry: Omit<PendingFoodEntry, 'id' | 'synced' | 'serverId'>): Promise<string> {
    const id = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingEntry: PendingFoodEntry = {
      id,
      ...entry,
      synced: false,
    };

    // Converter para formato NutritionData
    const nutritionData: NutritionData = {
      id,
      mealType: entry.mealType as any,
      foods: [
        {
          id: entry.foodId || 'unknown',
          name: entry.name,
          amount: entry.quantity,
          unit: entry.unit,
          calories: 0, // Será calculado pelo backend
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      ],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      loggedAt: entry.consumedAt,
      createdAt: new Date(),
      updatedAt: new Date(),
      synced: false,
    };

    // Salvar no IndexedDB
    await this.db.saveNutrition(nutritionData);

    console.log('[FoodDiarySync] Entry saved offline:', id);
    return id;
  }

  /**
   * Buscar todas as entradas pendentes de sincronização
   */
  async getPendingEntries(): Promise<PendingFoodEntry[]> {
    const nutritionData = await this.db.getNutritionByDate(new Date());
    
    return nutritionData
      .filter(n => !n.synced)
      .map(n => this.nutritionToPending(n));
  }

  /**
   * Converter NutritionData para PendingFoodEntry
   */
  private nutritionToPending(nutrition: NutritionData): PendingFoodEntry {
    const food = nutrition.foods[0];
    
    return {
      id: nutrition.id,
      foodId: food.id !== 'unknown' ? food.id : undefined,
      name: food.name,
      quantity: food.amount,
      unit: food.unit,
      mealType: nutrition.mealType,
      consumedAt: nutrition.loggedAt,
      synced: nutrition.synced,
      notes: '',
    };
  }

  /**
   * Sincronizar todas as entradas pendentes com o backend
   */
  async syncPendingEntries(): Promise<SyncStatus> {
    console.log('[FoodDiarySync] Starting sync...');

    const status: SyncStatus = {
      pendingCount: 0,
      syncing: true,
      lastSyncAt: null,
      error: null,
    };

    try {
      const pendingEntries = await this.getPendingEntries();
      status.pendingCount = pendingEntries.length;

      if (pendingEntries.length === 0) {
        status.syncing = false;
        status.lastSyncAt = new Date();
        return status;
      }

      console.log(`[FoodDiarySync] Found ${pendingEntries.length} pending entries`);

      // Sincronizar uma por uma para evitar problemas
      let syncedCount = 0;
      let errorCount = 0;

      for (const entry of pendingEntries) {
        try {
          const response = await this.syncEntryToBackend(entry);
          
          if (response.success) {
            // Marcar como sincronizado
            await this.markAsSynced(entry.id, response.data.id);
            syncedCount++;
          } else {
            errorCount++;
            console.error('[FoodDiarySync] Failed to sync entry:', entry.id, response.error);
          }
        } catch (error) {
          errorCount++;
          console.error('[FoodDiarySync] Error syncing entry:', entry.id, error);
        }
      }

      console.log(`[FoodDiarySync] Sync completed: ${syncedCount} synced, ${errorCount} errors`);

      status.syncing = false;
      status.lastSyncAt = new Date();
      status.error = errorCount > 0 ? `${errorCount} entries failed to sync` : null;

      return status;
    } catch (error) {
      console.error('[FoodDiarySync] Sync failed:', error);
      status.syncing = false;
      status.error = error instanceof Error ? error.message : 'Unknown error';
      return status;
    }
  }

  /**
   * Sincronizar uma entrada específica com o backend
   */
  private async syncEntryToBackend(entry: PendingFoodEntry): Promise<any> {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId');

    if (!token || !tenantId) {
      throw new Error('No authentication token or tenant ID found');
    }

    const response = await fetch('/api/nutrition/tracking/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify({
        foodId: entry.foodId,
        name: entry.name,
        quantity: entry.quantity,
        unit: entry.unit,
        mealType: entry.mealType,
        consumedAt: entry.consumedAt,
        notes: entry.notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${await response.text()}`);
    }

    return await response.json();
  }

  /**
   * Marcar entrada como sincronizada
   */
  private async markAsSynced(entryId: string, serverId: string): Promise<void> {
    const nutritionData = await this.db.getNutrition(nutritionData => nutritionData.id === entryId);
    
    if (nutritionData) {
      nutritionData.synced = true;
      nutritionData.serverId = serverId;
      await this.db.updateNutrition(entryId, nutritionData);
    }
  }

  /**
   * Buscar status de sincronização
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const pendingEntries = await this.getPendingEntries();
    const lastSyncAt = await this.db.getSetting('lastFoodDiarySync');

    return {
      pendingCount: pendingEntries.length,
      syncing: false,
      lastSyncAt: lastSyncAt ? new Date(lastSyncAt) : null,
      error: null,
    };
  }

  /**
   * Verificar se está online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Escutar eventos de conexão
   */
  setupConnectionListener(callback: () => void): void {
    window.addEventListener('online', () => {
      console.log('[FoodDiarySync] Connection restored, starting sync...');
      this.syncPendingEntries().then(callback);
    });

    window.addEventListener('offline', () => {
      console.log('[FoodDiarySync] Connection lost');
    });
  }

  /**
   * Deletar entrada pendente
   */
  async deletePendingEntry(entryId: string): Promise<boolean> {
    return await this.db.deleteNutrition(entryId);
  }

  /**
   * Limpar todas as entradas sincronizadas antigas (mais de 7 dias)
   */
  async cleanupOldSyncedEntries(): Promise<number> {
    const nutritionData = await this.db.getAllNutrition();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldSynced = nutritionData.filter(n => 
      n.synced && n.loggedAt < sevenDaysAgo
    );

    for (const entry of oldSynced) {
      await this.db.deleteNutrition(entry.id);
    }

    return oldSynced.length;
  }
}

// Instância singleton
let syncInstance: FoodDiarySyncService | null = null;

export function getFoodDiarySync(): FoodDiarySyncService {
  if (!syncInstance) {
    syncInstance = new FoodDiarySyncService();
  }
  return syncInstance;
}

/**
 * Helper para adicionar alimento offline
 */
export async function addFoodOffline(data: {
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
  mealType: string;
  consumedAt?: Date;
  notes?: string;
}): Promise<string> {
  const syncService = getFoodDiarySync();
  await syncService.init();

  const entryId = await syncService.addPendingEntry({
    foodId: data.foodId,
    name: data.name,
    quantity: data.quantity,
    unit: data.unit,
    mealType: data.mealType,
    consumedAt: data.consumedAt || new Date(),
    notes: data.notes,
  });

  // Se estiver online, tentar sincronizar imediatamente
  if (syncService.isOnline()) {
    setTimeout(() => syncService.syncPendingEntries(), 1000);
  }

  return entryId;
}

/**
 * Helper para sincronizar manualmente
 */
export async function manualSync(): Promise<SyncStatus> {
  const syncService = getFoodDiarySync();
  return await syncService.syncPendingEntries();
}



