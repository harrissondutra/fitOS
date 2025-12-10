// FitOS Service Worker - Implementação oficial Next.js PWA
// Baseado na documentação: https://nextjs.org/docs/app/guides/progressive-web-apps

const CACHE_NAME = 'fitos-cache-v1';
const STATIC_CACHE_NAME = 'fitos-static-v1';
const DYNAMIC_CACHE_NAME = 'fitos-dynamic-v1';

// URLs para cache estático
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
];

// Install event - Instala o Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    Promise.all([
      // Cache estático
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(urlsToCache);
      }),
      // Cache dinâmico
      caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Dynamic cache ready');
        return cache;
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - Ativa o Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assumir controle de todos os clientes
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    }).catch((error) => {
      console.error('[SW] Activation failed:', error);
    })
  );
});

// Fetch event - Intercepta requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar requisições que não são HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Ignorar requisições do Chrome extension
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Estratégia de cache baseada no tipo de requisição
  if (request.method === 'GET') {
    event.respondWith(handleRequest(request));
  }
});

// Função para lidar com requisições
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. API Routes - Network First
    if (url.pathname.startsWith('/api/')) {
      return await networkFirstStrategy(request);
    }
    
    // 2. Static Assets - Cache First
    if (isStaticAsset(request)) {
      return await cacheFirstStrategy(request);
    }
    
    // 3. HTML Pages - Stale While Revalidate
    if (request.destination === 'document') {
      return await staleWhileRevalidateStrategy(request);
    }
    
    // 4. Images - Cache First
    if (request.destination === 'image') {
      return await cacheFirstStrategy(request);
    }
    
    // 5. Fonts - Cache First
    if (url.pathname.match(/\.(woff2?|eot|ttf|otf)$/)) {
      return await cacheFirstStrategy(request);
    }
    
    // 6. Default - Network First
    return await networkFirstStrategy(request);
    
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    
    // Fallback para página offline
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Retornar erro genérico
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Estratégia: Network First
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Estratégia: Cache First
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    throw error;
  }
}

// Estratégia: Stale While Revalidate
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch((error) => {
    console.log('[SW] Network failed for stale-while-revalidate:', error);
    return cachedResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Verificar se é um asset estático
function isStaticAsset(request) {
  const url = new URL(request.url);
  
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|eot|ttf|otf)$/)
  );
}

// Push event - Notificações push (seguindo documentação oficial)
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || '1',
        url: data.url || '/'
      },
      actions: [
        {
          action: 'open',
          title: 'Abrir',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/icons/icon-192x192.png'
        }
      ],
      tag: data.tag || 'fitos-notification',
      requireInteraction: data.requireInteraction || false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FitOS', options)
    );
  }
});

// Notification click event (seguindo documentação oficial)
self.addEventListener('notificationclick', function (event) {
  console.log('Notification click received.');
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Verificar se já existe uma janela aberta
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Abrir nova janela
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Função para sincronização em background
async function doBackgroundSync() {
  try {
    console.log('[SW] Performing background sync');
    
    // Implementar lógica de sincronização offline
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/')) {
        try {
          const response = await fetch(request);
          if (response.ok) {
            await cache.put(request, response);
          }
        } catch (error) {
          console.log('[SW] Background sync failed for:', request.url);
        }
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

console.log('[SW] Service Worker loaded successfully');