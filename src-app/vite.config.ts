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
      /* v4.62.0-OFFLINE — os ícones do manifesto NÃO entram no precache por
         esta via. `includeManifestIcons` (padrão true) adiciona cada ícone
         com um `revision` calculado, e o `globPatterns` logo abaixo já
         inclui os mesmos PNGs com `revision: null`. O Workbox recusa a lista
         duplicada e lança, no install:

           add-to-cache-list-conflicting-entries
             assets/icons/logo-192.png
             assets/icons/logo-192.png?__WB_REVISION__=b0881f94…

         A exceção aborta o precache INTEIRO: o SW até ativa, mas
         `caches.keys()` fica vazio e qualquer navegação offline cai em
         ERR_INTERNET_DISCONNECTED (o “dinossauro”). Desligar a injeção deixa
         os ícones uma única vez, pelo glob — e continua valendo se um ícone
         for renomeado. */
      includeManifestIcons: false,
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
        /* v4.56.21 — precache do APP SHELL (o que garante abrir offline):
           JS/CSS/HTML/SVG/ICO + fontes + PNGs (ícones e artes de loading).
           JPG/WEBP (wallpapers, backgrounds) e as mídias pesadas (GIFs de
           exercício, áudios) NÃO entram no precache: vêm do runtimeCaching
           ao serem vistos. Antes um JPG com acento no nome
           (assets/images/background/MANUTENÇÃO.jpg) estava no precache e
           qualquer falha de casamento de URL derrubava a instalação INTEIRA
           do service worker — sem SW não existe offline. */
        globPatterns: ['**/*.{js,css,html,svg,ico,woff2,png}'],
        globIgnores: ['**/assets/exerciciosgif/**', '**/assets/sounds/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
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
          // Imagens avulsas (backgrounds, wallpapers, emblemas, fotos de
          // tela) e qualquer JPG/WEBP: cache sob demanda.
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
