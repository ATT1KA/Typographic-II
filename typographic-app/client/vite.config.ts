import { defineConfig } from 'vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  plugins: [
    babel({
      babelHelpers: 'bundled',
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      plugins: ['babel-plugin-inferno']
    })
  ],
  resolve: {
    dedupe: ['inferno']
  },
  optimizeDeps: {
    force: true,
    include: ['inferno']
  },
  esbuild: {
    jsx: 'preserve'  // Let Babel handle JSX transform
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
