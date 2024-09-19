import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), mkcert(), VitePWA({ 
    registerType: 'autoUpdate',
    includeAssets: ['src/*.png'],
      manifest: {
        name: 'Hehe Chat',
        short_name: 'Hehe',
        description: 'Twitchs finest chat app',
        theme_color: '#480356',
        icons: [
          {
            src: 'android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
  })],
  base: '/HeheChat/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  }
});