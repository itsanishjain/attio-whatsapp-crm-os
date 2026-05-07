import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env';
import { healthRoutes } from './routes/health';
import { integrationRoutes } from './routes/integration';
import { sessionRoutes } from './routes/session';
import { settingsRouter } from './routes/settings';
import { wabaRoutes } from './routes/waba';
import { whatsappRoutes } from './routes/whatsapp';

const app = new Hono();

app.use(
  '/api/*',
  cors({
    origin: env.FRONTEND_APP_URL,
  }),
);

const routedApp = app
  .route('/api', healthRoutes)
  .route('/api/integration', integrationRoutes)
  .route('/api/whatsapp/waba', wabaRoutes)
  .route('/api/whatsapp', whatsappRoutes)
  .route('/api/settings', settingsRouter)
  .route('/api/session', sessionRoutes);

export { app };
export type AppType = typeof routedApp;
