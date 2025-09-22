import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useInferno = env.VITE_INFERNO_COMPAT === '1';

  return {
    plugins: [react({
      jsxRuntime: 'classic'
    })],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: useInferno ? {
        react: 'inferno-compat',
        'react-dom': 'inferno-compat',
        'react-dom/test-utils': 'inferno-test-utils'
      } : undefined
    },
    optimizeDeps: {
      force: true,
      include: ['react', 'react-dom', 'react-router-dom']
    },
    esbuild: {
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
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
  };
});
