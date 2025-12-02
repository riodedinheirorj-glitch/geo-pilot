import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa"; // Import VitePWA

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'RotaSmart - Gestão Inteligente de Rotas e Entregas',
        short_name: 'RotaSmart',
        description: 'Sistema profissional para otimização de rotas, agrupamento e exportação de ordens de entrega. Otimize sua logística com RotaSmart.',
        theme_color: '#00baff',
        background_color: '#16181d',
        display: 'standalone',
        icons: [
          {
            src: '/rotasmart-logo-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/rotasmart-logo-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/rotasmart-logo-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'app-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://tiles.stadiamaps.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'stadia-tiles-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://us1.locationiq.com' || url.origin === 'https://nominatim.openstreetmap.org',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'geocode-api-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));