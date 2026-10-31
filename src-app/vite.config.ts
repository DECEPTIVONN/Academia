import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

/**
 * v4.41.0 — em `npm run dev` o Vercel não está servindo `/api/*`.
 * Este middleware usa a MESMA função ESM publicada em `src-app/api`, para
 * testar a expansão de playlists do Spotify localmente sem proxy externo.
 */
function spotifyDevApi(): Plugin {
  return {
    name: 'academia-spotify-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/spotify-playlist', async (req, res) => {
        const parsed = new URL(req.url || '', 'http://localhost');
        const type = parsed.searchParams.get('type') || '';
        const id = parsed.searchParams.get('id') || '';
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        try {
          const mod = (await import(
            new URL('./api/spotify-playlist.js', import.meta.url).href
          )) as {
            fetchSpotifyEntity: (kind: string, spotifyId: string) => Promise<unknown>;
          };
          const result = await mod.fetchSpotifyEntity(type, id);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (err) {
          res.statusCode = 502;
          res.end(
            JSON.stringify({
              error:
                err instanceof Error
                  ? err.message
                  : 'Não foi possível obter a playlist do Spotify.',
            }),
          );
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    spotifyDevApi(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // v4.56.20 — OFFLINE REAL: o `selfDestroying: true` da configuração
      // anterior fazia o SW gerado se AUTO-DESREGISTRAR e apagar todos os
      // caches no activate — o PWA instalado não abria nada sem internet.
      // Fora isso, o precache agora é enxuto de propósito:
      //   • app shell (JS/CSS/HTML/SVG) + fontes (vendor e FA) + ícones/bg;
      //   • imagens da splash/loading importadas por src/assets;
      //   • GIFs de exercício (23 MB) e áudios (17 MB) ficam de FORA do
      //     precache: entram pelo runtimeCaching ao serem vistos (CacheFirst).
      // Sem includeAssets de propósito: globPatterns já cobre favicon, ícones,
      // backgrounds e as imagens da splash (antes os mesmos arquivos entravam
      // duas vezes no precache).
      manifest: {
        name: 'EVO FIT',
        short_name: 'EVO FIT',
        description: 'Rastreador de treinos gamificado — offline-first com sincronização em nuvem',
        theme_color: '#8b5cf6',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/assets/icons/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/assets/icons/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/assets/icons/logo-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        categories: ['health', 'fitness'],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // App shell + fontes + ícones/bg + imagens importadas de src/assets.
        // Caminhos com espaço (GIFs) ficam fora via globIgnores.
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2,png,jpg,webp}'],
        globIgnores: ['**/assets/exerciciosgif/**', '**/assets/sounds/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Rotas de API nunca caem no index.html (previews/offline).
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // Material Symbols (CDN): depois do 1º carregamento a fonte e o CSS
          // passam a vir do cache, então os ícones continuam funcionando offline.
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets-v1',
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 40, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          // GIFs/WEBP dos exercícios: cache sob demanda (não vão no precache).
          {
            urlPattern: /\.(?:gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-media-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 250, maxAgeSeconds: 60 * 24 * 60 * 60 },
            },
          },
          // Fontes locais (vendor/fonts + Font Awesome webfonts).
          {
            urlPattern: /(?:fonts|webfonts)\/.+\.woff2$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 60, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          // Imagens avulsas (backgrounds, emblemas, fotos de tela).
          {
            urlPattern: /assets\//i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets-v1',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          // Supabase e APIs sempre pela rede (dados/dados de sessão nunca vêm
          // de cache); offline o app usa o banco local + fila de sync.
          {
            urlPattern: /supabase\.co\/(?:rest|auth|realtime)\//i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/api\//i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    host: true,
  },
});
