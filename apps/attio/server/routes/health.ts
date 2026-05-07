import { getHealthStatus } from '@server/services/health-service';
import { Hono } from 'hono';

export const healthRoutes = new Hono().get('/health', async (context) => {
  return context.json(await getHealthStatus());
});
