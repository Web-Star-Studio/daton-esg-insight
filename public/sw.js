// ESG System Service Worker - Advanced Caching and Offline Support
const CACHE_NAME = 'esg-system-v1.2.0';
const OFFLINE_URL = '/offline.html';

// Recursos críticos para cache (Always cached)
const CRITICAL_RESOURCES = [
  '/',
  '/dashboard',
  '/offline.html',
  '/manifest.json'
];

// Recursos estáticos para cache
const STATIC_RESOURCES = [
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/images/logo.png'
];

// APIs que devem ser cached
const API_CACHE_PATTERNS = [
  /\/api\/dashboard/,
  /\/api\/goals/,
  /\/api\/licenses/,
  /\/api\/emissions/
];

// Install - Cache recursos críticos
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Pre-caching critical resources');
        return cache.addAll([...CRITICAL_RESOURCES, ...STATIC_RESOURCES]);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker install failed:', error);
      })
  );
});

// Activate - Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch - Estratégias de cache inteligentes
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests não-HTTP
  if (!request.url.startsWith('http')) return;

  // Estratégia: Cache First para recursos estáticos
  if (isStaticResource(request)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Estratégia: Network First para APIs com fallback
  if (isAPIRequest(request)) {
    event.respondWith(networkFirstWithCache(request));
    return;
  }

  // Estratégia: Stale While Revalidate para páginas
  if (isNavigationRequest(request)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: Network First
  event.respondWith(networkFirst(request));
});

// Background Sync para operações offline
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-goals') {
    event.waitUntil(syncGoalsData());
  }
  
  if (event.tag === 'background-sync-emissions') {
    event.waitUntil(syncEmissionsData());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📬 Push message received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível',
    icon: '/assets/images/icon-192.png',
    badge: '/assets/images/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalhes',
        icon: '/assets/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/assets/images/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Sistema ESG', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification click received.');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// =============== ESTRATÉGIAS DE CACHE ===============

// Cache First - Para recursos estáticos
async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      console.log('📦 Cache hit:', request.url);
      return cached;
    }

    console.log('🌐 Cache miss, fetching:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('❌ Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First com Cache Fallback
async function networkFirstWithCache(request) {
  try {
    console.log('🌐 Network first:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful API responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      console.log('💾 API response cached:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('📦 Network failed, trying cache:', request.url);
    const cached = await caches.match(request);
    
    if (cached) {
      // Add stale indicator header
      const staleResponse = cached.clone();
      staleResponse.headers.set('X-Cache-Status', 'STALE');
      return staleResponse;
    }
    
    return createOfflineResponse(request);
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached || createOfflineResponse(request));

  return cached || fetchPromise;
}

// Network First
async function networkFirst(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cached = await caches.match(request);
    return cached || createOfflineResponse(request);
  }
}

// =============== FUNÇÕES AUXILIARES ===============

function isStaticResource(request) {
  const url = new URL(request.url);
  return /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/.test(url.pathname);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') || 
         API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  if (isNavigationRequest(request)) {
    return caches.match(OFFLINE_URL);
  }
  
  if (isAPIRequest(request)) {
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'Dados não disponíveis offline',
      cached: false
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Status': 'OFFLINE'
      }
    });
  }
  
  return new Response('Offline', { 
    status: 503,
    headers: { 'X-Cache-Status': 'OFFLINE' }
  });
}

// =============== BACKGROUND SYNC ===============

async function syncGoalsData() {
  try {
    console.log('🎯 Syncing goals data in background...');
    
    // Obter dados pendentes do IndexedDB ou localStorage
    const pendingGoals = await getPendingGoalsFromStorage();
    
    for (const goal of pendingGoals) {
      try {
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goal)
        });
        
        if (response.ok) {
          console.log('✅ Goal synced:', goal.id);
          await removePendingGoalFromStorage(goal.id);
        }
      } catch (error) {
        console.error('❌ Failed to sync goal:', goal.id, error);
      }
    }
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

async function syncEmissionsData() {
  try {
    console.log('🌱 Syncing emissions data in background...');
    // Implementar sincronização de dados de emissões
  } catch (error) {
    console.error('❌ Emissions sync failed:', error);
  }
}

// Funções de storage (implementar com IndexedDB)
async function getPendingGoalsFromStorage() {
  // Implementar leitura do IndexedDB
  return [];
}

async function removePendingGoalFromStorage(goalId) {
  // Implementar remoção do IndexedDB
  console.log('Removed pending goal:', goalId);
}

// =============== CACHE MANAGEMENT ===============

// Limpeza automática de cache por idade
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAN_OLD_CACHE') {
    cleanOldCacheEntries();
  }
});

async function cleanOldCacheEntries() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  const oldEntries = requests.filter(request => {
    // Lógica para identificar entradas antigas
    return false; // Implementar baseado em timestamp
  });
  
  await Promise.all(
    oldEntries.map(request => cache.delete(request))
  );
  
  console.log(`🧹 Cleaned ${oldEntries.length} old cache entries`);
}