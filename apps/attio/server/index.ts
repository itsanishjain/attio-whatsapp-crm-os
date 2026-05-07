import { existsSync } from 'node:fs';
import path from 'node:path';
import { app } from './app';
import { env } from './env';
import { APP_SERVICE_NAME } from './lib/app-identity';

const productionStaticRoot = path.resolve(process.cwd(), 'dist/frontend');

function resolveStaticPath(url: URL) {
  const pathname = decodeURIComponent(url.pathname);
  const normalizedPath =
    pathname === '/' ? 'index.html' : path.normalize(pathname);
  const relativePath = normalizedPath
    .replace(/^(\.\.(\/|\\|$))+/, '')
    .replace(/^[/\\]+/, '');

  return path.join(productionStaticRoot, relativePath);
}

async function serveStaticAsset(request: Request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Not Found', { status: 404 });
  }

  const url = new URL(request.url);
  const assetPath = resolveStaticPath(url);

  if (existsSync(assetPath)) {
    return new Response(Bun.file(assetPath));
  }

  const fallbackPath = path.join(productionStaticRoot, 'index.html');

  if (existsSync(fallbackPath)) {
    return new Response(Bun.file(fallbackPath));
  }

  return new Response('Not Found', { status: 404 });
}

console.log(
  `${APP_SERVICE_NAME} HTTP server listening on http://localhost:${env.PORT}`,
);

Bun.serve({
  port: env.PORT,
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) {
      return app.fetch(request);
    }

    if (env.NODE_ENV === 'production') {
      return serveStaticAsset(request);
    }

    return new Response('Not Found', { status: 404 });
  },
  idleTimeout: 120,
});
