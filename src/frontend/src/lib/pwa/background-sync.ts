// FitOS Background Sync
// Sistema de sincronização em background

import { getOfflineQueue } from './offline-queue';
import { trackPWAEvent } from './pwa-utils';

export interface BackgroundSyncConfig {
  enablePeriodicSync: boolean;
  syncInterval: number; // em milissegundos
  enableWorkoutSync: boolean;
  enableNutritionSync: boolean;
  enableProgressSync: boolean;
  enableChatSync: boolean;
  maxRetries: number;
  retryDelay: number; // em milissegundos
}

export const defaultBackgroundSyncConfig: BackgroundSyncConfig = {
  enablePeriodicSync: true,
  syncInterval: 5 * 60 * 1000, // 5 minutos
  enableWorkoutSync: true,
  enableNutritionSync: true,
  enableProgressSync: true,
  enableChatSync: true,
  maxRetries: 3,
  retryDelay: 1000,
};

export class BackgroundSyncManager {
  private config: BackgroundSyncConfig;
  private syncInterval: any | null = null;
  private isRegistered: boolean = false;
  private offlineQueue = getOfflineQueue();

  constructor(config: Partial<BackgroundSyncConfig> = {}) {
    this.config = { ...defaultBackgroundSyncConfig, ...config };
  }

  // Registrar background sync
  async register(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.warn('[Background Sync] Service Worker not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (!('sync' in registration)) {
        console.warn('[Background Sync] Background Sync not supported');
        return false;
      }

      // Registrar sync tags
      const syncTags = this.getSyncTags();
      
      for (const tag of syncTags) {
        await (registration as any).sync.register(tag);
        console.log(`[Background Sync] Registered sync tag: ${tag}`);
      }

      this.isRegistered = true;
      this.startPeriodicSync();
      
      trackPWAEvent('background_sync_registered', {
        tags: syncTags,
        config: this.config,
      });

      return true;
    } catch {
      console.error('[Background Sync] Registration failed');
      trackPWAEvent('background_sync_registration_failed', { error: 'Registration failed' });
      return false;
    }
  }

  // Obter tags de sincronização
  private getSyncTags(): string[] {
    const tags = [];
    
    if (this.config.enableWorkoutSync) tags.push('workout-sync');
    if (this.config.enableNutritionSync) tags.push('nutrition-sync');
    if (this.config.enableProgressSync) tags.push('progress-sync');
    if (this.config.enableChatSync) tags.push('chat-sync');
    
    return tags;
  }

  // Iniciar sincronização periódica
  private startPeriodicSync(): void {
    if (!this.config.enablePeriodicSync || this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.triggerSync();
    }, this.config.syncInterval);

    console.log('[Background Sync] Periodic sync started');
  }

  // Parar sincronização periódica
  private stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('[Background Sync] Periodic sync stopped');
    }
  }

  // Disparar sincronização
  async triggerSync(): Promise<void> {
    if (!this.isRegistered) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Disparar sync para cada tag
      const syncTags = this.getSyncTags();
      
      for (const tag of syncTags) {
        await (registration as any).sync.register(tag);
      }

      trackPWAEvent('background_sync_triggered', {
        tags: syncTags,
      });
    } catch {
      console.error('[Background Sync] Trigger failed');
      trackPWAEvent('background_sync_trigger_failed', { error: 'Trigger failed' });
    }
  }

  // Sincronizar dados específicos
  async syncData(type: 'workout' | 'nutrition' | 'progress' | 'chat', data: any): Promise<boolean> {
    try {
      await this.offlineQueue.queueSyncData(data, type, {
        priority: 'high',
      });

      trackPWAEvent('background_sync_data_queued', {
        type,
        dataSize: JSON.stringify(data).length,
      });

      return true;
    } catch {
      console.error(`[Background Sync] Failed to queue ${type} data`);
      trackPWAEvent('background_sync_data_queue_failed', {
        type,
        error: 'Data queue failed',
      });
      return false;
    }
  }

  // Sincronizar treino
  async syncWorkout(workoutData: {
    id: string;
    name: string;
    exercises: any[];
    completedAt?: Date;
    notes?: string;
  }): Promise<boolean> {
    return this.syncData('workout', {
      ...workoutData,
      syncedAt: new Date().toISOString(),
    });
  }

  // Sincronizar nutrição
  async syncNutrition(nutritionData: {
    id: string;
    mealType: string;
    foods: any[];
    calories: number;
    loggedAt: Date;
  }): Promise<boolean> {
    return this.syncData('nutrition', {
      ...nutritionData,
      syncedAt: new Date().toISOString(),
    });
  }

  // Sincronizar progresso
  async syncProgress(progressData: {
    id: string;
    type: 'weight' | 'measurements' | 'photos' | 'metrics';
    value: any;
    recordedAt: Date;
  }): Promise<boolean> {
    return this.syncData('progress', {
      ...progressData,
      syncedAt: new Date().toISOString(),
    });
  }

  // Sincronizar chat
  async syncChat(chatData: {
    id: string;
    message: string;
    senderId: string;
    recipientId?: string;
    timestamp: Date;
  }): Promise<boolean> {
    return this.syncData('chat', {
      ...chatData,
      syncedAt: new Date().toISOString(),
    });
  }

  // Obter status da sincronização
  async getSyncStatus(): Promise<{
    isRegistered: boolean;
    isPeriodicSyncActive: boolean;
    queueStats: any;
    lastSync?: Date;
  }> {
    const queueStats = await this.offlineQueue.getQueueStats();
    
    return {
      isRegistered: this.isRegistered,
      isPeriodicSyncActive: !!this.syncInterval,
      queueStats,
      lastSync: undefined, // Implementar tracking de última sincronização
    };
  }

  // Configurar sincronização
  updateConfig(newConfig: Partial<BackgroundSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar sincronização periódica se necessário
    if (newConfig.enablePeriodicSync !== undefined || newConfig.syncInterval !== undefined) {
      this.stopPeriodicSync();
      if (this.config.enablePeriodicSync) {
        this.startPeriodicSync();
      }
    }

    trackPWAEvent('background_sync_config_updated', { config: this.config });
  }

  // Limpar dados de sincronização
  async clearSyncData(): Promise<void> {
    await this.offlineQueue.clearQueue();
    trackPWAEvent('background_sync_data_cleared');
  }

  // Destruir manager
  destroy(): void {
    this.stopPeriodicSync();
    this.isRegistered = false;
  }
}

// Instância singleton
let backgroundSyncInstance: BackgroundSyncManager | null = null;

export function getBackgroundSyncManager(config?: Partial<BackgroundSyncConfig>): BackgroundSyncManager {
  if (!backgroundSyncInstance) {
    backgroundSyncInstance = new BackgroundSyncManager(config);
  }
  return backgroundSyncInstance;
}

// Função de conveniência para registrar background sync
export async function registerBackgroundSync(config?: Partial<BackgroundSyncConfig>): Promise<boolean> {
  const manager = getBackgroundSyncManager(config);
  return manager.register();
}

// Função de conveniência para sincronizar dados
export async function syncData(
  type: 'workout' | 'nutrition' | 'progress' | 'chat',
  data: any
): Promise<boolean> {
  const manager = getBackgroundSyncManager();
  return manager.syncData(type, data);
}
