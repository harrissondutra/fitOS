// FitOS Offline Queue
// Sistema de fila para sincronização offline

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { trackPWAEvent } from './pwa-utils';

interface OfflineQueueDB extends DBSchema {
  requests: {
    key: string;
    value: QueuedRequest;
  };
  sync: {
    key: string;
    value: SyncData;
  };
}

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
  category: 'workout' | 'nutrition' | 'progress' | 'chat' | 'general';
}

interface SyncData {
  id: string;
  data: any;
  type: string;
  timestamp: number;
  synced: boolean;
}

export class OfflineQueue {
  private db: IDBPDatabase<OfflineQueueDB> | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncInterval: any | null = null;

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  // Inicializar IndexedDB
  private async init(): Promise<void> {
    try {
      this.db = await openDB<OfflineQueueDB>('fitos-offline-queue', 1, {
        upgrade(db) {
          // Tabela de requisições offline
          if (!db.objectStoreNames.contains('requests')) {
            const requestStore = db.createObjectStore('requests', { keyPath: 'id' });
            (requestStore as any).createIndex('timestamp', 'timestamp', { unique: false });
            (requestStore as any).createIndex('priority', 'priority', { unique: false });
            (requestStore as any).createIndex('category', 'category', { unique: false });
            (requestStore as any).createIndex('synced', 'synced', { unique: false });
          }

          // Tabela de dados para sincronização
          if (!db.objectStoreNames.contains('sync')) {
            const syncStore = db.createObjectStore('sync', { keyPath: 'id' });
            (syncStore as any).createIndex('type', 'type');
            (syncStore as any).createIndex('timestamp', 'timestamp');
            (syncStore as any).createIndex('synced', 'synced');
          }
        },
      });

      console.log('[Offline Queue] Database initialized');
    } catch {
      console.error('[Offline Queue] Database initialization failed');
    }
  }

  // Configurar event listeners
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.startSync();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.stopSync();
    });

    // Iniciar sincronização se estiver online
    if (this.isOnline) {
      this.startSync();
    }
  }

  // Adicionar requisição à fila
  async queueRequest(
    url: string,
    method: string,
    body?: any,
    headers: Record<string, string> = {},
    options: {
      priority?: 'high' | 'medium' | 'low';
      category?: 'workout' | 'nutrition' | 'progress' | 'chat' | 'general';
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const requestId = this.generateId();
    const queuedRequest: QueuedRequest = {
      id: requestId,
      url,
      method,
      headers,
      body,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      priority: options.priority || 'medium',
      category: options.category || 'general',
    };

    await this.db.add('requests', queuedRequest);
    
    trackPWAEvent('offline_request_queued', {
      category: options.category,
      priority: options.priority,
      method,
    });

    // Tentar sincronizar imediatamente se estiver online
    if (this.isOnline) {
      this.processQueue();
    }

    return requestId;
  }

  // Adicionar dados para sincronização
  async queueSyncData(
    data: any,
    type: string,
    options: {
      priority?: 'high' | 'medium' | 'low';
    } = {}
  ): Promise<string> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const syncId = this.generateId();
    const syncData: SyncData = {
      id: syncId,
      data,
      type,
      timestamp: Date.now(),
      synced: false,
    };

    await this.db.add('sync', syncData);
    
    trackPWAEvent('offline_data_queued', {
      type,
      priority: options.priority,
    });

    // Tentar sincronizar imediatamente se estiver online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return syncId;
  }

  // Processar fila de requisições
  private async processQueue(): Promise<void> {
    if (!this.db || this.syncInProgress) return;

    this.syncInProgress = true;

    try {
      const requests = await this.db.getAll('requests');
      
      // Ordenar por prioridade e timestamp
      const sortedRequests = requests.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        return a.timestamp - b.timestamp;
      });

      for (const request of sortedRequests) {
        try {
          await this.executeRequest(request);
          await this.db.delete('requests', request.id);
          
          trackPWAEvent('offline_request_synced', {
            category: request.category,
            method: request.method,
          });
        } catch {
          console.error('[Offline Queue] Request failed');
          
          // Incrementar contador de tentativas
          request.retryCount++;
          
          if (request.retryCount >= request.maxRetries) {
            // Remover da fila após esgotar tentativas
            await this.db.delete('requests', request.id);
            
            trackPWAEvent('offline_request_failed', {
              category: request.category,
              method: request.method,
              retryCount: request.retryCount,
            });
          } else {
            // Atualizar contador de tentativas
            await this.db.put('requests', request);
          }
        }
      }
    } catch {
      console.error('[Offline Queue] Queue processing failed');
    } finally {
      this.syncInProgress = false;
    }
  }

  // Processar fila de sincronização
  private async processSyncQueue(): Promise<void> {
    if (!this.db) return;

    try {
      const syncData = await this.db.getAll('sync');
      const unsyncedData = syncData.filter(item => !item.synced);

      for (const item of unsyncedData) {
        try {
          await this.syncData(item);
          item.synced = true;
          await this.db.put('sync', item);
          
          trackPWAEvent('offline_data_synced', {
            type: item.type,
          });
        } catch {
          console.error('[Offline Queue] Sync failed');
        }
      }
    } catch {
      console.error('[Offline Queue] Sync queue processing failed');
    }
  }

  // Executar requisição
  private async executeRequest(request: QueuedRequest): Promise<void> {
    const response = await fetch(request.url, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...request.headers,
      },
      body: request.body ? JSON.stringify(request.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Sincronizar dados
  private async syncData(syncData: SyncData): Promise<void> {
    const endpoint = this.getSyncEndpoint(syncData.type);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(syncData.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }

  // Obter endpoint de sincronização
  private getSyncEndpoint(type: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    switch (type) {
      case 'workout':
        return `${baseUrl}/api/workouts/sync`;
      case 'nutrition':
        return `${baseUrl}/api/nutrition/sync`;
      case 'progress':
        return `${baseUrl}/api/progress/sync`;
      case 'chat':
        return `${baseUrl}/api/chat/sync`;
      default:
        return `${baseUrl}/api/sync`;
    }
  }

  // Iniciar sincronização automática
  private startSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.processQueue();
      this.processSyncQueue();
    }, 30000); // Sincronizar a cada 30 segundos

    // Sincronizar imediatamente
    this.processQueue();
    this.processSyncQueue();
  }

  // Parar sincronização automática
  private stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Obter estatísticas da fila
  async getQueueStats(): Promise<{
    pendingRequests: number;
    pendingSyncData: number;
    categories: Record<string, number>;
  }> {
    if (!this.db) {
      return { pendingRequests: 0, pendingSyncData: 0, categories: {} };
    }

    const requests = await this.db.getAll('requests');
    const syncData = await this.db.getAll('sync');
    
    const categories = requests.reduce((acc, request) => {
      acc[request.category] = (acc[request.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      pendingRequests: requests.length,
      pendingSyncData: syncData.filter(item => !item.synced).length,
      categories,
    };
  }

  // Limpar fila
  async clearQueue(): Promise<void> {
    if (!this.db) return;

    await this.db.clear('requests');
    await this.db.clear('sync');
    
    trackPWAEvent('offline_queue_cleared');
  }

  // Limpar dados antigos
  async cleanupOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) return;

    const cutoffTime = Date.now() - maxAge;
    
    // Limpar requisições antigas
    const requests = await this.db.getAll('requests');
    const oldRequests = requests.filter(req => req.timestamp < cutoffTime);
    
    for (const request of oldRequests) {
      await this.db.delete('requests', request.id);
    }

    // Limpar dados de sincronização antigos
    const syncData = await this.db.getAll('sync');
    const oldSyncData = syncData.filter(item => item.timestamp < cutoffTime);
    
    for (const item of oldSyncData) {
      await this.db.delete('sync', item.id);
    }

    trackPWAEvent('offline_queue_cleanup', {
      oldRequests: oldRequests.length,
      oldSyncData: oldSyncData.length,
    });
  }

  // Gerar ID único
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Destruir instância
  destroy(): void {
    this.stopSync();
    this.db = null;
  }
}

// Instância singleton
let offlineQueueInstance: OfflineQueue | null = null;

export function getOfflineQueue(): OfflineQueue {
  if (!offlineQueueInstance) {
    offlineQueueInstance = new OfflineQueue();
  }
  return offlineQueueInstance;
}

// Função de conveniência para adicionar requisição
export async function queueRequest(
  url: string,
  method: string,
  body?: any,
  headers?: Record<string, string>,
  options?: {
    priority?: 'high' | 'medium' | 'low';
    category?: 'workout' | 'nutrition' | 'progress' | 'chat' | 'general';
    maxRetries?: number;
  }
): Promise<string> {
  const queue = getOfflineQueue();
  return queue.queueRequest(url, method, body, headers, options);
}

// Função de conveniência para adicionar dados de sincronização
export async function queueSyncData(
  data: any,
  type: string,
  options?: {
    priority?: 'high' | 'medium' | 'low';
  }
): Promise<string> {
  const queue = getOfflineQueue();
  return queue.queueSyncData(data, type, options);
}
