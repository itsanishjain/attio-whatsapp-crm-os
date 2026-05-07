import { pingDatabase } from '@server/db/client';
import { APP_SERVICE_NAME } from '@server/lib/app-identity';
import {
  type HealthResponse,
  healthResponseSchema,
} from '@shared/schemas/health';

export async function getHealthStatus(): Promise<HealthResponse> {
  await pingDatabase();

  return healthResponseSchema.parse({
    ok: true,
    service: APP_SERVICE_NAME,
    database: {
      reachable: true,
    },
    timestamp: new Date().toISOString(),
  });
}
