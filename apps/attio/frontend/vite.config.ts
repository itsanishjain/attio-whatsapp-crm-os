import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appPort = Number(env.PORT || '3000');
  const allowedHosts = new Set<string>(['localhost', '127.0.0.1']);

  if (env.FRONTEND_APP_URL) {
    try {
      allowedHosts.add(new URL(env.FRONTEND_APP_URL).hostname);
    } catch {
      // Ignore malformed URLs here; env validation happens on the server side.
    }
  }

  if (env.FRONTEND_ALLOWED_HOSTS) {
    for (const host of env.FRONTEND_ALLOWED_HOSTS.split(',')) {
      const normalizedHost = host.trim();
      if (normalizedHost) {
        allowedHosts.add(normalizedHost);
      }
    }
  }

  return {
    build: {
      outDir: '../dist/frontend',
      emptyOutDir: true,
    },
    plugins: [
      tailwindcss(),
      react(),
      tanstackRouter({
        routesDirectory: path.join(import.meta.dirname, './src/routes'),
        generatedRouteTree: path.join(
          import.meta.dirname,
          './src/routeTree.gen.ts',
        ),
      }),
    ],
    root: './frontend',
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        '@server': path.resolve(import.meta.dirname, '../server'),
        '@shared': path.resolve(import.meta.dirname, '../shared'),
      },
    },
    server: {
      host: true,
      port: 5175,
      allowedHosts: Array.from(allowedHosts),
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${appPort}`,
          changeOrigin: true,
          xfwd: true,
        },
      },
    },
  };
});
