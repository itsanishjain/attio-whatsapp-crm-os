import { env } from '@server/env';
import {
  disconnectLocalBaileysSession,
  getLocalBaileysSessionStatus,
  listLocalWhatsappGroups,
  requestLocalBaileysConnect,
  sendWhatsappMessageViaLocalRuntime,
} from '@server/services/baileys-session';
import { isMessageSendError } from '@server/services/message-sender-service';
import { sendResponseSchema } from '@shared/schemas/send-message';
import { baileysSessionStatusSchema } from '@whatsapp-crm/core/schemas/baileys';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';

const baileysApp = new Hono();
const installationIdParamSchema = z.string().min(1);

function getBearerToken(header: string | undefined) {
  const [scheme, token] = header?.split(/\s+/, 2) ?? [];
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

baileysApp.use('/*', cors());

baileysApp.use('/*', async (context, next) => {
  if (context.req.path === '/health') {
    return next();
  }

  if (!env.BAILEYS_SERVICE_TOKEN) {
    if (env.NODE_ENV === 'production') {
      return context.json(
        { ok: false, error: 'Baileys service auth is not configured' },
        503,
      );
    }

    return next();
  }

  const token = getBearerToken(context.req.header('authorization'));
  if (token !== env.BAILEYS_SERVICE_TOKEN) {
    return context.json({ ok: false, error: 'Unauthorized' }, 401);
  }

  return next();
});

baileysApp.get('/health', (context) => {
  return context.json({ ok: true, service: 'baileys' });
});

baileysApp.get('/status/:installationId', async (context) => {
  const parsedInstallationId = installationIdParamSchema.safeParse(
    context.req.param('installationId'),
  );

  if (!parsedInstallationId.success) {
    return context.json({ ok: false, error: 'Invalid installation id' }, 400);
  }

  const status = await getLocalBaileysSessionStatus(parsedInstallationId.data);

  if (!status) {
    return context.json({ ok: false, error: 'Session not found' }, 404);
  }

  return context.json(baileysSessionStatusSchema.parse(status));
});

baileysApp.post('/connect/:installationId', async (context) => {
  const parsedInstallationId = installationIdParamSchema.safeParse(
    context.req.param('installationId'),
  );

  if (!parsedInstallationId.success) {
    return context.json({ ok: false, error: 'Invalid installation id' }, 400);
  }

  return context.json(
    baileysSessionStatusSchema.parse(
      await requestLocalBaileysConnect(parsedInstallationId.data),
    ),
  );
});

baileysApp.delete('/disconnect/:installationId', async (context) => {
  const parsedInstallationId = installationIdParamSchema.safeParse(
    context.req.param('installationId'),
  );

  if (!parsedInstallationId.success) {
    return context.json({ ok: false, error: 'Invalid installation id' }, 400);
  }

  return context.json(
    baileysSessionStatusSchema.parse(
      await disconnectLocalBaileysSession(parsedInstallationId.data),
    ),
  );
});

baileysApp.get('/groups/:installationId', async (context) => {
  const parsedInstallationId = installationIdParamSchema.safeParse(
    context.req.param('installationId'),
  );

  if (!parsedInstallationId.success) {
    return context.json({ ok: false, error: 'Invalid installation id' }, 400);
  }

  return context.json(await listLocalWhatsappGroups(parsedInstallationId.data));
});

baileysApp.post('/send/:installationId', async (context) => {
  const parsedInstallationId = installationIdParamSchema.safeParse(
    context.req.param('installationId'),
  );

  if (!parsedInstallationId.success) {
    return context.json({ ok: false, error: 'Invalid installation id' }, 400);
  }

  try {
    const body = await context.req.json();
    const result = await sendWhatsappMessageViaLocalRuntime(
      parsedInstallationId.data,
      body,
    );
    return context.json(sendResponseSchema.parse(result), 202);
  } catch (error) {
    if (isMessageSendError(error)) {
      return context.json(
        { ok: false, error: error.message, code: error.code },
        error.status as 400,
      );
    }

    throw error;
  }
});

export { baileysApp };
