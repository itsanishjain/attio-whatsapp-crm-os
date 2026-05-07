import { env } from '@server/env';
import {
  ingestWabaWebhookPayload,
  registerWabaConnection,
} from '@server/services/waba-sync';
import { Hono } from 'hono';

function hasValidRelaySecret(secret: string | undefined) {
  return Boolean(env.WABA_RELAY_SECRET && secret === env.WABA_RELAY_SECRET);
}

export const wabaRoutes = new Hono()
  .post('/connections', async (context) => {
    if (!hasValidRelaySecret(context.req.header('x-waba-relay-secret'))) {
      return context.json({ ok: false, error: 'Unauthorized' }, 401);
    }

    try {
      const connection = await registerWabaConnection(await context.req.json());
      return context.json({
        ok: true,
        installationId: connection.installationId,
        wabaId: connection.wabaId,
        phoneNumberId: connection.phoneNumberId,
        status: connection.status,
      });
    } catch (error) {
      return context.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to register WABA connection',
        },
        400,
      );
    }
  })
  .post('/events', async (context) => {
    if (!hasValidRelaySecret(context.req.header('x-waba-relay-secret'))) {
      return context.json({ ok: false, error: 'Unauthorized' }, 401);
    }

    try {
      const result = await ingestWabaWebhookPayload(await context.req.json());
      return context.json({ ok: true, ...result });
    } catch (error) {
      console.error(
        '[waba-relay] Failed to ingest WABA webhook payload',
        error,
      );
      return context.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to ingest WABA webhook payload',
        },
        500,
      );
    }
  });
