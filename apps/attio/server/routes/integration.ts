import { randomUUID } from 'node:crypto';
import {
  createInstallation,
  findInstallationById,
  findInstallationByProviderAccountId,
  updateInstallationAuth,
  updateInstallationConnection,
  upsertInstallation,
} from '@server/db/queries/installations';
import { APP_PROVIDER } from '@server/lib/app-identity';
import {
  clearInstallationSessionCookie,
  getAuthorizedInstallationId,
  getBrowserSessionId,
  getOrCreateBrowserSessionId,
  setInstallationSessionCookie,
} from '@server/lib/app-session';
import {
  buildPublicUrl,
  getPublicRequestUrl,
} from '@server/lib/public-request-url';
import { AttioClient } from '@server/services/attio-client';
import {
  buildAttioAuthorizationUrl,
  createAttioOauthState,
  exchangeAttioAuthorizationCode,
  hasAttioOauthConfig,
  verifyAttioOauthState,
} from '@server/services/attio-oauth';
import {
  buildIntegrationAuthJson,
  getIntegrationAccessToken,
  parseIntegrationAuthJson,
} from '@server/services/integration-service';
import {
  integrationDisconnectResponseSchema,
  integrationOauthStartResponseSchema,
  integrationStatusResponseSchema,
} from '@shared/schemas/integration';
import { type Context, Hono } from 'hono';
import { z } from 'zod';

const attioCallbackQuerySchema = z.object({
  code: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});

function buildDashboardRedirectUrl(
  requestUrl: string,
  status: 'connected' | 'error',
) {
  const redirectUrl = new URL('/dashboard', requestUrl);
  redirectUrl.searchParams.set('attio', status);
  return redirectUrl.toString();
}

function toStatusTenant(auth: ReturnType<typeof parseIntegrationAuthJson>) {
  return auth.tenantName ?? auth.accountSlug ?? auth.accountId ?? null;
}

async function getAttioIdentity(
  accessToken: string,
  fallbackAccountId: string,
) {
  const client = new AttioClient(accessToken);
  const identity = await client.getWorkspaceLabel();

  return {
    ...identity,
    providerAccountId: identity.providerAccountId ?? fallbackAccountId,
    tenantName: identity.tenantName,
  };
}

async function ensureAuthorizedInstallation(context: Context) {
  const authorizedInstallationId = getAuthorizedInstallationId(context);

  if (authorizedInstallationId) {
    return authorizedInstallationId;
  }

  const installation = await createInstallation({
    provider: APP_PROVIDER,
    providerAccountId: `pending:${randomUUID()}`,
    authJson: buildIntegrationAuthJson({}),
    status: 'pending',
    settingsJson: null,
  });

  setInstallationSessionCookie(context, installation.id);

  return installation.id;
}

export const integrationRoutes = new Hono()
  .get('/status', async (context) => {
    const authorizedInstallationId = getAuthorizedInstallationId(context);

    if (!authorizedInstallationId) {
      return context.json(
        integrationStatusResponseSchema.parse({
          connected: false,
          tenant: null,
        }),
      );
    }

    const installation = await findInstallationById(authorizedInstallationId);

    if (!installation) {
      return context.json(
        integrationStatusResponseSchema.parse({
          connected: false,
          tenant: null,
        }),
      );
    }

    const auth = parseIntegrationAuthJson(installation.authJson);
    const accessToken = getIntegrationAccessToken(auth);
    const tenant = toStatusTenant(auth);

    if (!accessToken || installation.status !== 'connected') {
      return context.json(
        integrationStatusResponseSchema.parse({
          connected: false,
          tenant,
        }),
      );
    }

    return context.json(
      integrationStatusResponseSchema.parse({
        connected: true,
        tenant,
      }),
    );
  })
  .get('/oauth/start', async (context) => {
    try {
      if (!hasAttioOauthConfig()) {
        throw new Error('Attio OAuth env is incomplete');
      }

      const browserSessionId = getOrCreateBrowserSessionId(context);
      const installationId = await ensureAuthorizedInstallation(context);
      const state = createAttioOauthState(browserSessionId, installationId);

      return context.json(
        integrationOauthStartResponseSchema.parse({
          ok: true,
          authorizationUrl: buildAttioAuthorizationUrl(state),
        }),
      );
    } catch (error) {
      console.error('[attio-oauth] Failed to start OAuth flow', {
        error: error instanceof Error ? error.message : error,
        authorizedInstallationId: getAuthorizedInstallationId(context),
        requestUrl: context.req.url,
      });

      return context.json(
        {
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to start Attio OAuth',
        },
        503,
      );
    }
  })
  .get('/oauth/callback', async (context) => {
    const query = attioCallbackQuerySchema.parse(context.req.query());
    const errorRedirectUrl = buildDashboardRedirectUrl(
      getPublicRequestUrl(context).toString(),
      'error',
    );

    if (query.error || !query.code || !query.state) {
      return context.redirect(errorRedirectUrl, 302);
    }

    try {
      const oauthState = verifyAttioOauthState(query.state);
      const browserSessionId = getBrowserSessionId(context);

      if (
        !oauthState ||
        !browserSessionId ||
        oauthState.sid !== browserSessionId
      ) {
        throw new Error('Attio OAuth state is invalid or expired');
      }

      const tokenResponse = await exchangeAttioAuthorizationCode(query.code);
      const requestedInstallation = oauthState.installationId
        ? await findInstallationById(oauthState.installationId)
        : null;
      const fallbackAccountId = requestedInstallation
        ? `installation:${requestedInstallation.id}`
        : `pending:${randomUUID()}`;
      const identity = await getAttioIdentity(
        tokenResponse.access_token,
        fallbackAccountId,
      );
      const existingInstallation = await findInstallationByProviderAccountId(
        APP_PROVIDER,
        identity.providerAccountId,
      );
      const authJson = buildIntegrationAuthJson({
        accessToken: tokenResponse.access_token,
        tokenType: tokenResponse.token_type ?? 'Bearer',
        scope: tokenResponse.scope ?? null,
        tenantName: identity.tenantName,
        accountId: identity.providerAccountId,
        userName: identity.userName ?? null,
      });

      const installation =
        existingInstallation &&
        (!requestedInstallation ||
          existingInstallation.id !== requestedInstallation.id)
          ? await upsertInstallation({
              provider: APP_PROVIDER,
              providerAccountId: identity.providerAccountId,
              authJson,
              status: 'connected',
              settingsJson: existingInstallation.settingsJson ?? null,
            })
          : requestedInstallation
            ? await updateInstallationConnection(requestedInstallation.id, {
                providerAccountId: identity.providerAccountId,
                authJson,
                status: 'connected',
                settingsJson: requestedInstallation.settingsJson ?? null,
              })
            : await upsertInstallation({
                provider: APP_PROVIDER,
                providerAccountId: identity.providerAccountId,
                authJson,
                status: 'connected',
                settingsJson: null,
              });

      if (!installation) {
        throw new Error('Attio OAuth did not return an installation');
      }

      setInstallationSessionCookie(context, installation.id);

      return context.redirect(
        buildPublicUrl(context, '/dashboard?attio=connected'),
        302,
      );
    } catch (error) {
      console.error('[attio-oauth] Callback failed', {
        error: error instanceof Error ? error.message : error,
        requestUrl: context.req.url,
        hasCode: Boolean(query.code),
        hasState: Boolean(query.state),
        browserSessionId: getBrowserSessionId(context),
      });

      return context.redirect(errorRedirectUrl, 302);
    }
  })
  .delete('/disconnect', async (context) => {
    const authorizedInstallationId = getAuthorizedInstallationId(context);
    if (!authorizedInstallationId) {
      return context.json({ ok: false, error: 'Unauthorized' }, 401);
    }

    const installation = await findInstallationById(authorizedInstallationId);

    if (installation) {
      const auth = parseIntegrationAuthJson(installation.authJson);

      await updateInstallationAuth(installation.id, {
        authJson: buildIntegrationAuthJson({
          tenantName: toStatusTenant(auth),
          accountId: auth.accountId,
          userName: auth.userName,
        }),
        settingsJson: installation.settingsJson ?? null,
        status: 'disconnected',
      });
      clearInstallationSessionCookie(context);
    }

    return context.json(
      integrationDisconnectResponseSchema.parse({ disconnected: true }),
    );
  })
  .post('/bootstrap', async (context) => {
    await ensureAuthorizedInstallation(context);

    return context.json(
      integrationStatusResponseSchema.parse({
        connected: false,
        tenant: null,
      }),
    );
  });
