import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // v4.18.0-music — '!assets/sounds/**' exclui o MAIN.mp3 (7,2 MB) do
      // precache: ele é cacheado sob demanda via runtimeCaching StaleWhileRevalidate.
      includeAssets: ['favicon.ico', 'assets/**/*', '!assets/sounds/**'],
      manifest: {
        name: 'EVO FIT Workout Tracker',
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
