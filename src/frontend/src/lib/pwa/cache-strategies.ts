// FitOS Cache Strategies
// Estratégias de cache para diferentes tipos de recursos

export interface CacheStrategy {
  name: string;
  handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
  options: {
    cacheName: string;
    expiration?: {
      maxEntries?: number;
      maxAgeSeconds?: number;
    };
    plugins?: any[];
  };
}

export interface CacheConfig {
  enablePrecaching: boolean;
  enableRuntimeCaching: boolean;
  enableBackgroundSync: boolean;
  enableOfflineAnalytics: boolean;
  cachePrefix: string;
  maxCacheSize: number;
  maxCacheAge: number; // em dias
}

export const defaultCacheConfig: CacheConfig = {
  enablePrecaching: true,
  enableRuntimeCaching: true,
  enableBackgroundSync: true,
  enableOfflineAnalytics: true,
  cachePrefix: 'fitos',
  maxCacheSize: 50, // 50MB
  maxCacheAge: 30, // 30 dias
};

// Estratégias de cache para diferentes tipos de recursos
export const cacheStrategies: Record<string, CacheStrategy> = {
  // Assets estáticos - Cache First
  staticAssets: {
    name: 'Static Assets',
    handler: 'CacheFirst',
    options: {
      cacheName: 'fitos-static-v1',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
      },
    },
  },

  // Imagens - Stale While Revalidate
  images: {
    name: 'Images',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'fitos-images-v1',
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
      },
    },
  },

  // APIs - Network First
  api: {
    name: 'API Calls',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'fitos-api-v1',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      },
    },
  },

  // Dados dinâmicos - Stale While Revalidate
  dynamicContent: {
    name: 'Dynamic Content',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'fitos-dynamic-v1',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 12 * 60 * 60, // 12 horas
      },
    },
  },

  // Fontes - Cache First
  fonts: {
    name: 'Fonts',
    handler: 'CacheFirst',
    options: {
      cacheName: 'fitos-fonts-v1',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
      },
    },
  },

  // Dados offline - Cache Only
  offlineData: {
    name: 'Offline Data',
    handler: 'CacheOnly',
    options: {
      cacheName: 'fitos-offline-v1',
      expiration: {
        maxEntries: 1000,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
      },
    },
  },

  // Autenticação - Network Only
  auth: {
    name: 'Authentication',
    handler: 'NetworkOnly',
    options: {
      cacheName: 'fitos-auth-v1',
    },
  },
};

// Padrões de URL para diferentes estratégias
export const urlPatterns: Record<string, RegExp> = {
  staticAssets: /\.(?:js|css|woff2?|ttf|eot)$/,
  images: /\.(?:jpg|jpeg|png|gif|webp|avif|svg|ico)$/,
  api: /\/api\//,
  dynamicContent: /\.(?:html|json)$/,
  fonts: /\.(?:woff2?|ttf|eot)$/,
  auth: /\/api\/auth\//,
};

// Configuração de precaching
export const precacheConfig = {
  // Recursos críticos para precache
  criticalResources: [
    '/',
    '/offline',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
  ],
  
  // Recursos para cache em runtime
  runtimeResources: [
    '/_next/static/css/',
    '/_next/static/js/',
    '/_next/static/chunks/',
  ],
  
  // Recursos externos
  externalResources: [
    'https://fonts.googleapis.com/',
    'https://fonts.gstatic.com/',
  ],
};

// Estratégias de cache personalizadas para FitOS
export const fitosCacheStrategies = {
  // Treinos - Cache com sincronização
  workouts: {
    name: 'Workouts',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'fitos-workouts-v1',
      expiration: {
        maxEntries: 200,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      },
    },
  },

  // Exercícios - Cache First (mudam pouco)
  exercises: {
    name: 'Exercises',
    handler: 'CacheFirst',
    options: {
      cacheName: 'fitos-exercises-v1',
      expiration: {
        maxEntries: 500,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
      },
    },
  },

  // Progresso - Network First (sempre atualizado)
  progress: {
    name: 'Progress',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'fitos-progress-v1',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60, // 1 hora
      },
    },
  },

  // Chat - Stale While Revalidate
  chat: {
    name: 'Chat',
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'fitos-chat-v1',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 30 * 60, // 30 minutos
      },
    },
  },

  // Nutrição - Network First
  nutrition: {
    name: 'Nutrition',
    handler: 'NetworkFirst',
    options: {
      cacheName: 'fitos-nutrition-v1',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 2 * 60 * 60, // 2 horas
      },
    },
  },

  // Dados do usuário - Cache First
  userData: {
    name: 'User Data',
    handler: 'CacheFirst',
    options: {
      cacheName: 'fitos-user-v1',
      expiration: {
        maxEntries: 10,
        maxAgeSeconds: 24 * 60 * 60, // 24 horas
      },
    },
  },
};

// Utilitários para gerenciar cache
export class CacheManager {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultCacheConfig, ...config };
  }

  // Obter estratégia de cache para uma URL
  getStrategyForUrl(url: string): CacheStrategy | null {
    for (const [patternName, pattern] of Object.entries(urlPatterns)) {
      if (pattern.test(url)) {
        return cacheStrategies[patternName] || null;
      }
    }

    // Estratégia padrão para APIs
    if (url.includes('/api/')) {
      return cacheStrategies.api;
    }

    // Estratégia padrão para assets estáticos
    return cacheStrategies.staticAssets;
  }

  // Obter estratégia personalizada do FitOS
  getFitOSStrategy(type: keyof typeof fitosCacheStrategies): CacheStrategy {
    return fitosCacheStrategies[type] as CacheStrategy;
  }

  // Limpar cache por nome
  async clearCache(cacheName: string): Promise<boolean> {
    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      for (const key of keys) {
        await cache.delete(key);
      }

      return true;
    } catch {
      console.error(`[Cache Manager] Failed to clear cache ${cacheName}`);
      return false;
    }
  }

  // Limpar todos os caches
  async clearAllCaches(): Promise<boolean> {
    try {
      const cacheNames = await caches.keys();
      const fitosCaches = cacheNames.filter(name => 
        name.startsWith(this.config.cachePrefix)
      );

      for (const cacheName of fitosCaches) {
        await this.clearCache(cacheName);
      }

      return true;
    } catch {
      console.error('[Cache Manager] Failed to clear all caches');
      return false;
    }
  }

  // Obter estatísticas do cache
  async getCacheStats(): Promise<{
    cacheNames: string[];
    totalSize: number;
    entryCount: number;
  }> {
    try {
      const cacheNames = await caches.keys();
      const fitosCaches = cacheNames.filter(name => 
        name.startsWith(this.config.cachePrefix)
      );

      let totalSize = 0;
      let entryCount = 0;

      for (const cacheName of fitosCaches) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        entryCount += keys.length;

        for (const key of keys) {
          const response = await cache.match(key);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return {
        cacheNames: fitosCaches,
        totalSize,
        entryCount,
      };
    } catch {
      console.error('[Cache Manager] Failed to get cache stats');
      return {
        cacheNames: [],
        totalSize: 0,
        entryCount: 0,
      };
    }
  }

  // Verificar se um recurso está em cache
  async isCached(url: string, cacheName?: string): Promise<boolean> {
    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        return !!(await cache.match(url));
      }

      // Verificar em todos os caches
      const cacheNames = await caches.keys();
      const fitosCaches = cacheNames.filter(name => 
        name.startsWith(this.config.cachePrefix)
      );

      for (const name of fitosCaches) {
        const cache = await caches.open(name);
        if (await cache.match(url)) {
          return true;
        }
      }

      return false;
    } catch {
      console.error('[Cache Manager] Failed to check cache');
      return false;
    }
  }

  // Adicionar recurso ao cache
  async addToCache(url: string, response: Response, cacheName: string): Promise<boolean> {
    try {
      const cache = await caches.open(cacheName);
      await cache.put(url, response);
      return true;
    } catch {
      console.error('[Cache Manager] Failed to add to cache');
      return false;
    }
  }

  // Obter recurso do cache
  async getFromCache(url: string, cacheName?: string): Promise<Response | null> {
    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        return await cache.match(url) || null;
      }

      // Procurar em todos os caches
      const cacheNames = await caches.keys();
      const fitosCaches = cacheNames.filter(name => 
        name.startsWith(this.config.cachePrefix)
      );

      for (const name of fitosCaches) {
        const cache = await caches.open(name);
        const response = await cache.match(url);
        if (response) {
          return response;
        }
      }

      return null;
    } catch {
      console.error('[Cache Manager] Failed to get from cache');
      return null;
    }
  }
}

// Instância singleton
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(config?: Partial<CacheConfig>): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager(config);
  }
  return cacheManagerInstance;
}
