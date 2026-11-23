const CACHE_NAME = 'academia-treino-v1';
const ASSETS_TO_CACHE = [
  './treino.html',
  './style/main.css',
  './style/footer.css',
  './style/treino.css',
  './componentes/thememanager.js',
  './componentes/theme-integration.js',
  './componentes/footer.js',
  './componentes/scroll-animations.js',
  './JS/treino.js',
  './Assets/Images/LogoItens/D.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Ignorando erros se algum arquivo falhar ao baixar
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
          return cache.add(url).catch(error => {
            console.error('Falha ao adicionar cache para', url, error);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora chamadas que não sejam de HTTP/HTTPS
  if (!event.request.url.startsWith('http')) return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        // Se estiver offline e pedir a página inicial, carrega do cache
        if (event.request.mode === 'navigate') {
          return caches.match('./treino.html');
        }
      });
    })
  );
});
