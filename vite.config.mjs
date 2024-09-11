import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), tsconfigPaths(), mkcert(), VitePWA({ registerType: 'autoUpdate' })],
  base: '/HeheChat/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  }
});