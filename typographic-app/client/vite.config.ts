import { defineConfig, loadEnv } from 'vite';
import path from 'node:path';
import fs from 'node:fs';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const useInferno = env.VITE_INFERNO_COMPAT === '1';
  const nmClient = path.resolve(process.cwd(), 'node_modules/inferno-compat');
  const nmParent = path.resolve(process.cwd(), '..', 'node_modules/inferno-compat');
  const infernoCompatAbs = fs.existsSync(nmClient) ? nmClient : nmParent;
  const infernoCompatEntry = fs.existsSync(path.join(infernoCompatAbs, 'dist', 'index.mjs'))
    ? path.join(infernoCompatAbs, 'dist', 'index.mjs')
    : infernoCompatAbs;
  const jsxShimAbs = path.resolve(process.cwd(), 'src/shims/jsx-runtime.ts');

  return {
    plugins: useInferno ? [] : [react()],
    resolve: {
      dedupe: ['react', 'react-dom', 'inferno', 'inferno-compat'],
      alias: useInferno
      ? [
      { find: 'react/jsx-runtime', replacement: jsxShimAbs },
      { find: 'react/jsx-dev-runtime', replacement: jsxShimAbs },
      { find: 'react-dom/client', replacement: infernoCompatEntry },
      { find: 'react-dom', replacement: infernoCompatEntry },
      { find: /^react$/, replacement: path.resolve(process.cwd(), 'src', 'shims', 'react-shim.ts') },
      { find: 'inferno-compat', replacement: infernoCompatEntry },
      { find: 'inferno', replacement: path.resolve(process.cwd(), '..', 'node_modules', 'inferno', 'dist', 'index.mjs') },
      { find: 'cookie', replacement: path.resolve(process.cwd(), 'src', 'shims', 'cookie-esm.ts') },
      { find: 'set-cookie-parser', replacement: path.resolve(process.cwd(), 'src', 'shims', 'set-cookie-parser-esm.ts') },
        ]
        : undefined,
    },
    esbuild: undefined,
    optimizeDeps: useInferno
      ? {
          noDiscovery: true,
          include: ['cookie'],
          exclude: ['inferno', 'inferno-compat', 'react', 'react-dom', 'react-router', 'react-router-dom', '@xyflow/react', 'react-toastify'],
        }
      : {
          force: true,
          include: ['react', 'react-dom', 'react-router-dom'],
        },
    ssr: useInferno
      ? {
          noExternal: ['cookie', 'react-router', 'react-router-dom', '@xyflow/react', 'react-toastify'],
        }
      : undefined,
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
