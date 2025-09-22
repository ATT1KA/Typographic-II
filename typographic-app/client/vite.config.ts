import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: [
      { find: /^inferno$/, replacement: '/src/shims/inferno-shim.ts' }
    ],
  },
  optimizeDeps: {
    // Default for native
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
      '/api-server': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
    },
  },
});
