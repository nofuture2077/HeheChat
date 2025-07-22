import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import mkcert from 'vite-plugin-mkcert';
import fs from 'fs';
import path from 'path';

// Plugin to inject version into manifest.json during build
function injectVersionPlugin() {
  return {
    name: 'inject-version',
    generateBundle() {
      // Read package.json to get version
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const version = packageJson.version;
      
      // Read manifest.json
      const manifestPath = path.resolve('public/manifest.json');
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Add version to manifest
      manifest.version = version;
      
      // Emit the updated manifest.json to the build output
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(manifest, null, 2)
      });
    }
  };
}

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
        replay: './replay.html',
        admin: './admin.html',
        alert: './alert.html'
      }
    }
  },
  plugins: [react(), tsconfigPaths(), mkcert(), injectVersionPlugin()],
  base: '#{import.meta.env.VITE_SLUG}',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.mjs',
  }
});
