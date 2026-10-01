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
      includeAssets: ['favicon.ico', 'assets/**/*'],
      manifest: {
        name: 'Academia Workout Tracker',
        short_name: 'Academia',
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
            // GIFs de exercícios — cache-first (pesados, imutáveis)
            urlPattern: /\.(?:gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-media-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // Fontes locais — cache-first
            urlPattern: /assets\/fonts\/.+\.woff2$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-v1',
              expiration: { maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          {
            // Supabase API — network-only (dados em tempo real)
            urlPattern: /supabase\.co\/rest\//i,
            handler: 'NetworkOnly',
          },
          {
            // Supabase Auth — network-only
            urlPattern: /supabase\.co\/auth\//i,
            handler: 'NetworkOnly',
          },
          {
            // Assets estáticos — stale-while-revalidate
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
    outDir: '../dist',      // Build vai para Academia/dist/ (usado pelo Capacitor)
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('motion')) {
              return 'motion-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('dexie')) {
              return 'dexie-vendor';
            }
          }
        },
      },
    },
  },

  server: {
    port: 5173,
    host: true,   // Expõe na rede local (Capacitor no Android via IP)
  },

  // CSS: Tailwind v4 processa via @tailwindcss/vite — sem configuração JS extra
});
