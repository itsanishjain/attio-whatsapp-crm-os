import { findInstallationById } from '@server/db/queries/installations';
import { findConnectedWabaConnectionByInstallationId } from '@server/db/queries/waba-connections';
import { env } from '@server/env';
import { getAuthorizedInstallationId } from '@server/lib/app-session';
import {
  disconnectBaileysSession,
  getBaileysSessionStatus,
  listWhatsappGroups,
  requestBaileysConnect,
  sendWhatsappMessageViaService,
} from '@server/services/baileys-session';
import { listWhatsappMessageLog } from '@server/services/baileys-sync';
import { getGroupSyncSettings } from '@server/services/group-service';
import { sendResponseSchema } from '@shared/schemas/send-message';
import {
  whatsappConnectResponseSchema,
  whatsappDisconnectResponseSchema,
  whatsappGroupsResponseSchema,
  whatsappStatusResponseSchema,
} from '@shared/schemas/whatsapp';
import type { BaileysSessionStatus } from '@whatsapp-crm/core/schemas/baileys';
import { whatsappMessageLogResponseSchema } from '@whatsapp-crm/core/schemas/baileys';
import { Hono } from 'hono';

function toWhatsappStatus(status: BaileysSessionStatus | null) {
  return whatsappStatusResponseSchema.parse({
    available: true,
    connected: status?.status === 'connected',
    status: status?.status ?? 'disconnected',
    phoneNumber: status?.phoneNumber ?? null,
    displayName: status?.displayName ?? null,
    qrCodeDataUrl: status?.qrCodeDataUrl ?? null,
    needsRelink: status?.needsRelink ?? false,
    disconnectCode: status?.disconnectCode ?? null,
  });
}

export const whatsappRoutes = new Hono()
  .get('/messages', async (context) => {
    const limitParam = Number(context.req.query('limit') ?? '25');
    const limit = Number.isInteger(limitParam)
      ? Math.min(Math.max(limitParam, 1), 100)
      : 25;
    const authorizedInstallationId = getAuthorizedInstallationId(context);
    const installation = authorizedInstallationId
      ? await findInstallationById(authorizedInstallationId)
      : null;

    return context.json(
      whatsappMessageLogResponseSchema.parse({
        items: installation
          ? await listWhatsappMessageLog(installation.id, limit)
          : [],
      }),
    );
  })
  .get('/status', async (context) => {
    const authorizedInstallationId = getAuthorizedInstallationId(context);
    if (!authorizedInstallationId) {
      return context.json(toWhatsappStatus(null));
    }

    try {
      const wabaConnection = await findConnectedWabaConnectionByInstallationId(
        authorizedInstallationId,
      );

      if (wabaConnection) {
        return context.json(
          whatsappStatusResponseSchema.parse({
            available: true,
            connected: true,
            status: 'connected',
            phoneNumber: wabaConnection.displayPhoneNumber,
            displayName: wabaConnection.verifiedName,
            qrCodeDataUrl: null,
            needsRelink: false,
            disconnectCode: null,
          }),
        );
      }

      return context.json(
        toWhatsappStatus(
          await getBaileysSessionStatus(authorizedInstallationId),
        ),
      );
    } catch {
      return context.json(toWhatsappStatus(null));
    }
  })
  .get('/official/start', async (context) => {
    const authorizedInstallationId = getAuthorizedInstallationId(context);
    if (!authorizedInstallationId) {
      return context.json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const authorizationUrl = new URL(env.WABA_ONBOARDING_URL);
    const returnUrl = new URL('/dashboard', env.FRONTEND_APP_URL);

    authorizationUrl.searchParams.set(
      'installationId',
      authorizedInstallationId,
    );
    authorizationUrl.searchParams.set('returnUrl', returnUrl.toString());

    return context.json({
      ok: true,
      authorizationUrl: authorizationUrl.toString(),
    });
  })
  .get('/groups', async (context) => {
    try {
      const authorizedInstallationId = getAuthorizedInstallationId(context);
      const installation = authorizedInstallationId
        ? await findInstallationById(authorizedInstallationId)
        : null;

      if (!installation) {
        return context.json(
          whatsappGroupsResponseSchema.parse({
            groups: [],
            settings: {
              groupSyncEnabled: false,
              groupSyncSelectedGroups: [],
            },
          }),
        );
      }

      const [groups, settings] = await Promise.all([
        listWhatsappGroups(installation.id),
        getGroupSyncSettings(installation.id),
      ]);

      return context.json(
        whatsappGroupsResponseSchema.parse({
          groups,
          settings,
        }),
      );
    } catch (error) {
      return context.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load WhatsApp groups',
        },
        502,
      );
    }
  })
  .post('/connect', async (context) => {
    const authorizedInstallationId = getAuthorizedInstallationId(context);
    if (!authorizedInstallationId) {
      return context.json({ ok: false, error: 'Unauthorized' }, 401);
    }

    try {
      const status = await requestBaileysConnect(authorizedInstallationId);
      return context.json(
        whatsappConnectResponseSchema.parse(toWhatsappStatus(status)),
      );
    } catch (error) {
      return context.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to start WhatsApp setup',
        },
        502,
      );
    }
  })
  .post('/send', async (context) => {
    const authorizedInstallationId = getAuthorizedInstallationId(context);
    if (!authorizedInstallationId) {
      return context.json({ ok: false, error: 'Unauthorized' }, 401);
    }

    try {
      const body = await context.req.json();
      const result = await sendWhatsappMessageViaService(
        authorizedInstallationId,
        body,
      );
      return context.json(sendResponseSchema.parse(result), 202);
    } catch (error) {
      const requestError = error as {
        status?: number;
        code?: string;
        message?: string;
      };
      const status = requestError.status ?? 500;
      const code = requestError.code ?? 'internal_error';
      return context.json(
        { ok: false, error: requestError.message ?? 'Internal error', code },
        status as 400,
      );
    }
  })
  .delete('/disconnect', async (context) => {
    const authorizedInstallationId = getAuthorizedInstallationId(context);
    if (!authorizedInstallationId) {
      return context.json({ ok: false, error: 'Unauthorized' }, 401);
    }

    try {
      return context.json(
        whatsappDisconnectResponseSchema.parse(
          toWhatsappStatus(
            await disconnectBaileysSession(authorizedInstallationId),
          ),
        ),
      );
    } catch (error) {
      return context.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to disconnect WhatsApp',
        },
        500,
      );
    }
  });
