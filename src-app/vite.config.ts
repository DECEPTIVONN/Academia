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
      // v4.18.0-music — '!assets/sounds/**' exclui o MAIN.mp3 (7,2 MB) do
      // precache: ele é cacheado sob demanda via runtimeCaching StaleWhileRevalidate.
      includeAssets: ['favicon.ico', 'assets/**/*', '!assets/sounds/**'],
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
          { src: '/assets/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable any' },
          { src: '/assets/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable any' },
        ],
        categories: ['health', 'fitness'],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\.(?:gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-media-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /assets\/fonts\/.+\.woff2$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-v1',
              expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /supabase\.co\/rest\//i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /supabase\.co\/auth\//i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /assets\//i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-assets-v1',
              expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
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
