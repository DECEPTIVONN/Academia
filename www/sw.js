const CACHE_NAME = 'academia-treino-v45';
const ASSETS_TO_CACHE = [
  './treino.html',
  './componentes/secoes/ficha.html',
  './componentes/secoes/treinos.html',
  './componentes/secoes/progresso.html',
  './componentes/secoes/perfil.html',
  './componentes/secoes/dashboard.html',
  './componentes/secoes/modais.html',
  './Style/main.css',
  './Style/footer.css',
  './Style/treino.css',
  './Style/treino/1-core.css',
  './Style/treino/2-modals.css',
  './Style/treino/3-foco-badges.css',
  './Style/treino/4-gamificacao.css',
  './Style/treino/5-premium-design.css',
  './Style/treino/secoes/bg-dinamico.css',
  './Style/treino/secoes/toolbar-busca.css',
  './Style/treino/secoes/deck-builder.css',
  './Style/treino/secoes/cards.css',
  './Style/treino/secoes/maestria.css',
  './Style/treino/secoes/modais.css',
  './Style/treino/secoes/tabs-subnav.css',
  './Style/treino/secoes/perfil.css',
  './Style/treino/secoes/dashboard.css',
  './Style/treino/secoes/placeholders-animacoes.css',
  './Style/treino/6-maestria.css',
  './Style/treino/7-nav-icons.css',
  './Style/treino/8-customizacao.css',
  './componentes/thememanager.js',
  './componentes/theme-integration.js',
  './componentes/footer.js',
  './componentes/scroll-animations.js',
  './JS/treino/loader.js',
  './JS/treino/db.js',
  './JS/treino/nav.js',
  './JS/treino/secao-ficha.js',
  './JS/treino/secao-treinos.js',
  './JS/treino/secao-progresso.js',
  './JS/treino/secao-perfil.js',
  './JS/treino/secao-customizacao.js',
  './JS/treino/secao-dashboard.js',
  './JS/treino/templates.js',
  './JS/treino/app.js',
  './Assets/Images/LogoItens/D.jpg',
  './vendor/tailwind.min.css',
  './vendor/fontawesome.min.css',
  './vendor/fonts.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  const isScriptOrStyle = event.request.url.includes('.js') || event.request.url.includes('.css') || event.request.url.includes('.html');

  if (isScriptOrStyle) {
    // Network First for logic and styles to avoid cache hell
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache First for other assets (images, etc)
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
