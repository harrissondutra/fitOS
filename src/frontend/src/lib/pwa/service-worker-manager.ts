// Service Worker Manager para PWA
// Gerencia o registro e comunicação com o Service Worker

export interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

export interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null;
  isSupported: boolean;
  isInstalled: boolean;
  isUpdated: boolean;
  isOnline: boolean;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private isInstalled: boolean = false;
  private isUpdated: boolean = false;
  private isOnline: boolean = true;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.isOnline = navigator.onLine;
    
    // Escutar mudanças de conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });
  }

  // Registrar Service Worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported) {
      console.warn('[SW Manager] Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[SW Manager] Service Worker registered:', this.registration);

      // Configurar listeners
      this.setupEventListeners();

      // Verificar se já está instalado
      if (this.registration.installing) {
        this.registration.installing.addEventListener('statechange', (e) => {
          if ((e.target as ServiceWorker).state === 'installed') {
            this.isInstalled = true;
            this.emit('installed');
          }
        });
      } else if (this.registration.waiting) {
        this.isInstalled = true;
        this.isUpdated = true;
        this.emit('updated');
      } else if (this.registration.active) {
        this.isInstalled = true;
        this.emit('activated');
      }

      return this.registration;
    } catch {
      console.error('[SW Manager] Service Worker registration failed');
      return null;
    }
  }

  // Configurar listeners de eventos
  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listener para atualizações
    this.registration.addEventListener('updatefound', () => {
      console.log('[SW Manager] Update found');
      
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Nova versão disponível
              this.isUpdated = true;
              this.emit('updated');
            } else {
              // Primeira instalação
              this.isInstalled = true;
              this.emit('installed');
            }
          }
        });
      }
    });

    // Listener para mensagens do Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleMessage(event.data);
    });

    // Listener para controle de Service Worker
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[SW Manager] Controller changed');
      this.emit('controllerchange');
    });
  }

  // Lidar com mensagens do Service Worker
  private handleMessage(message: ServiceWorkerMessage): void {
    console.log('[SW Manager] Message received:', message);

    switch (message.type) {
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', message.data);
        break;
      case 'CACHE_CLEARED':
        this.emit('cacheCleared', message.data);
        break;
      case 'OFFLINE_MODE':
        this.emit('offlineMode', message.data);
        break;
      case 'ONLINE_MODE':
        this.emit('onlineMode', message.data);
        break;
      default:
        this.emit('message', message);
    }
  }

  // Enviar mensagem para o Service Worker
  async sendMessage(message: ServiceWorkerMessage): Promise<any> {
    if (!this.registration?.active) {
      console.warn('[SW Manager] No active service worker');
      return null;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      this.registration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  // Atualizar Service Worker
  async update(): Promise<void> {
    if (!this.registration) {
      console.warn('[SW Manager] No service worker registered');
      return;
    }

    try {
      await this.registration.update();
      console.log('[SW Manager] Service Worker update requested');
    } catch {
      console.error('[SW Manager] Service Worker update failed');
    }
  }

  // Pular espera e ativar nova versão
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      console.warn('[SW Manager] No waiting service worker');
      return;
    }

    try {
      await this.sendMessage({ type: 'SKIP_WAITING' });
      console.log('[SW Manager] Skip waiting requested');
    } catch {
      console.error('[SW Manager] Skip waiting failed');
    }
  }

  // Limpar cache
  async clearCache(): Promise<void> {
    try {
      await this.sendMessage({ type: 'CLEAR_CACHE' });
      console.log('[SW Manager] Cache clear requested');
    } catch {
      console.error('[SW Manager] Cache clear failed');
    }
  }

  // Obter informações do cache
  async getCacheInfo(): Promise<any> {
    try {
      return await this.sendMessage({ type: 'GET_CACHE_INFO' });
    } catch {
      console.error('[SW Manager] Get cache info failed');
      return null;
    }
  }

  // Verificar se há atualização disponível
  async checkForUpdate(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      await this.registration.update();
      return !!this.registration.waiting;
    } catch {
      console.error('[SW Manager] Check for update failed');
      return false;
    }
  }

  // Adicionar listener de eventos
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Remover listener de eventos
  off(event: string, callback: Function): void {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event)!;
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // Emitir evento
  private emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event)!.forEach(callback => {
      try {
        callback(data);
      } catch {
        console.error('[SW Manager] Event listener error');
      }
    });
  }

  // Obter estado atual
  getState(): ServiceWorkerState {
    return {
      registration: this.registration,
      isSupported: this.isSupported,
      isInstalled: this.isInstalled,
      isUpdated: this.isUpdated,
      isOnline: this.isOnline,
    };
  }

  // Verificar se PWA pode ser instalado
  canInstall(): boolean {
    return this.isSupported && this.isInstalled && !this.isUpdated;
  }

  // Verificar se há atualização disponível
  hasUpdate(): boolean {
    return this.isUpdated;
  }

  // Verificar se está online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Instância singleton
export const serviceWorkerManager = new ServiceWorkerManager();

// Função de conveniência para inicializar
export async function initializeServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  return await serviceWorkerManager.register();
}

// Hook para usar o Service Worker Manager
export function useServiceWorker() {
  return serviceWorkerManager;
}