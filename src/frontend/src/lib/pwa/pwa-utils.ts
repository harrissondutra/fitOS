// FitOS PWA Utilities
// Utilitários para funcionalidades PWA

export interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PWAConfig {
  enableInstallPrompt: boolean;
  enableOfflineSupport: boolean;
  enablePushNotifications: boolean;
  enableBackgroundSync: boolean;
  enableShareAPI: boolean;
  enableWakeLock: boolean;
  enableBadgeAPI: boolean;
}

export const defaultPWAConfig: PWAConfig = {
  enableInstallPrompt: true,
  enableOfflineSupport: true,
  enablePushNotifications: true,
  enableBackgroundSync: true,
  enableShareAPI: true,
  enableWakeLock: true,
  enableBadgeAPI: true,
};

// Detectar se o app é instalável
export function isInstallable(): boolean {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator && 
         'PushManager' in window &&
         'Notification' in window;
}

// Detectar se está em modo standalone (instalado)
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
}

// Detectar plataforma
export function getPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/android/.test(userAgent)) return 'android';
  if (/windows|macintosh|linux/.test(userAgent)) return 'desktop';
  
  return 'unknown';
}

// Detectar se está offline
export function isOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return !navigator.onLine;
}

// Verificar suporte a APIs PWA
export function getPWACapabilities() {
  if (typeof window === 'undefined') {
    return {
      serviceWorker: false,
      pushNotifications: false,
      backgroundSync: false,
      shareAPI: false,
      wakeLock: false,
      badgeAPI: false,
      fileSystemAccess: false,
      webBluetooth: false,
      geolocation: false,
    };
  }

  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window && 'Notification' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    shareAPI: 'share' in navigator,
    wakeLock: 'wakeLock' in navigator,
    badgeAPI: 'setAppBadge' in navigator,
    fileSystemAccess: 'showOpenFilePicker' in window,
    webBluetooth: 'bluetooth' in navigator,
    geolocation: 'geolocation' in navigator,
  };
}

// Registrar service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service Worker registered successfully:', registration);
    return registration;
  } catch {
    console.error('[PWA] Service Worker registration failed');
    return null;
  }
}

// Função para verificar se PWA pode ser instalado
export function canInstallPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Verificar se já está instalado
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return false;
  }
  
  // Verificar se há evento beforeinstallprompt
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Função para obter informações do dispositivo
export function getDeviceInfo() {
  if (typeof window === 'undefined') return null;
  
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    memory: (navigator as any).deviceMemory,
    connection: (navigator as any).connection,
  };
}

// Função para verificar recursos PWA
export function checkPWAFeatures() {
  if (typeof window === 'undefined') return null;
  
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notification: 'Notification' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    periodicBackgroundSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype,
    webShare: 'share' in navigator,
    webShareTarget: 'serviceWorker' in navigator && 'share' in navigator,
    webAppManifest: 'serviceWorker' in navigator,
    cacheAPI: 'caches' in window,
    indexedDB: 'indexedDB' in window,
    localStorage: 'localStorage' in window,
    sessionStorage: 'sessionStorage' in window,
  };
}

// Verificar se há atualizações do service worker
export async function checkForUpdates(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return false;

    await registration.update();
    return registration.waiting !== null;
  } catch {
    console.error('[PWA] Error checking for updates');
    return false;
  }
}

// Aplicar atualização do service worker
export async function applyUpdate(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration || !registration.waiting) return;

    // Enviar mensagem para o service worker para pular waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Recarregar a página após a ativação
    window.location.reload();
  } catch {
    console.error('[PWA] Error applying update');
  }
}

// Configurar listener para atualizações
export function setupUpdateListener(callback: (registration: ServiceWorkerRegistration) => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
      callback(event.data.registration);
    }
  });
}

// Utilitários para cache
export async function clearCache(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('[PWA] All caches cleared');
  } catch {
    console.error('[PWA] Error clearing cache');
  }
}

// Utilitários para dados offline
export async function storeOfflineData(key: string, data: any): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const cache = await caches.open('fitos-offline-data');
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(`/offline-data/${key}`, response);
  } catch {
    console.error('[PWA] Error storing offline data');
  }
}

export async function getOfflineData(key: string): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    const cache = await caches.open('fitos-offline-data');
    const response = await cache.match(`/offline-data/${key}`);
    return response ? await response.json() : null;
  } catch {
    console.error('[PWA] Error getting offline data');
    return null;
  }
}

// Utilitários para analytics PWA
export function trackPWAEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  // Aqui você pode integrar com seu sistema de analytics
  console.log(`[PWA Analytics] ${eventName}:`, properties);
  
  // Exemplo de integração com Google Analytics
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', eventName, {
      event_category: 'PWA',
      ...properties,
    });
  }
}

// Utilitários para performance
export function measurePerformance(name: string, fn: () => void | Promise<void>) {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return fn();
  }

  const start = performance.now();
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const end = performance.now();
      console.log(`[PWA Performance] ${name}: ${end - start}ms`);
    });
  } else {
    const end = performance.now();
    console.log(`[PWA Performance] ${name}: ${end - start}ms`);
    return result;
  }
}

// Detectar recursos de hardware
export function getHardwareInfo() {
  if (typeof window === 'undefined') {
    return {
      cores: 0,
      memory: 0,
      connection: null,
    };
  }

  const nav = navigator as any;
  
  return {
    cores: nav.hardwareConcurrency || 0,
    memory: nav.deviceMemory || 0,
    connection: nav.connection ? {
      effectiveType: nav.connection.effectiveType,
      downlink: nav.connection.downlink,
      rtt: nav.connection.rtt,
    } : null,
  };
}

// Utilitários para notificações
export function requestNotificationPermission(): Promise<'default' | 'granted' | 'denied'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return Promise.resolve('denied');
  }

  return Notification.requestPermission();
}

// Utilitários para wake lock
export async function requestWakeLock(): Promise<any | null> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
    return null;
  }

  try {
    const wakeLock = await (navigator as any).wakeLock.request('screen');
    return wakeLock;
  } catch {
    console.error('[PWA] Error requesting wake lock');
    return null;
  }
}

// Utilitários para badge
export async function setAppBadge(count: number): Promise<void> {
  if (typeof window === 'undefined' || !('setAppBadge' in navigator)) {
    return;
  }

  try {
    if (count > 0) {
      await (navigator as any).setAppBadge(count);
    } else {
      await (navigator as any).clearAppBadge();
    }
  } catch {
    console.error('[PWA] Error setting app badge');
  }
}

// Utilitários para share API
export async function shareContent(data: any): Promise<boolean> {
  if (typeof window === 'undefined' || !('share' in navigator)) {
    return false;
  }

  try {
    await navigator.share(data);
    return true;
  } catch {
    console.error('[PWA] Error sharing content');
    return false;
  }
}

// Utilitários para geolocation
export function getCurrentPosition(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    });
  });
}

// Utilitários para Web Bluetooth
export async function requestBluetoothDevice(filters: any[]): Promise<any | null> {
  if (typeof window === 'undefined' || !('bluetooth' in navigator)) {
    return null;
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters,
      optionalServices: ['battery_service', 'device_information'],
    });
    return device;
  } catch {
    console.error('[PWA] Error requesting Bluetooth device');
    return null;
  }
}

// Utilitários para File System Access
export async function openFilePicker(accept: Record<string, string[]>): Promise<any | null> {
  if (typeof window === 'undefined' || !('showOpenFilePicker' in window)) {
    return null;
  }

  try {
    const [fileHandle] = await (window as any).showOpenFilePicker({
      types: Object.entries(accept).map(([description, extensions]) => ({
        description,
        accept: { 'image/*': extensions },
      })),
    });
    return fileHandle;
  } catch {
    console.error('[PWA] Error opening file picker');
    return null;
  }
}

// Utilitários para periodic background sync
export async function registerPeriodicSync(tag: string, minInterval: number): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('periodicSync' in registration) {
      await (registration as any).periodicSync.register(tag, {
        minInterval,
      });
    }
  } catch {
    console.error('[PWA] Error registering periodic sync');
  }
}

// Utilitários para background sync
export async function registerBackgroundSync(tag: string): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await (registration as any).sync.register(tag);
  } catch {
    console.error('[PWA] Error registering background sync');
  }
}
