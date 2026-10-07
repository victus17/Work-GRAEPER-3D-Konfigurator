import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Entwicklungsserver: Frontend auf :5173, API-Aufrufe werden an den Node-Server (:8787) durchgereicht.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } },
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
