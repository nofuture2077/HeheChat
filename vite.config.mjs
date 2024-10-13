import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        alert: './alert.html'
      }
    }
  },
  plugins: [react(), tsconfigPaths(), mkcert()],
  base: '#{import.meta.env.VITE_SLUG}',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  }
});