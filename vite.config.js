import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/vida-plena-training/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png'],
      manifest: {
        name: 'Vida Plena - Training Checklist',
        short_name: 'Vida Plena',
        description: 'Checklist de entrenamiento para el equipo',
        theme_color: '#065f46',
        background_color: '#065f46',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/vida-plena-training/',
        scope: '/vida-plena-training/',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
