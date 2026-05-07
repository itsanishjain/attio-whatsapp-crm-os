import { env } from '@server/env';
import { createAppSession } from '@whatsapp-crm/core/server/app-session';
import { z } from 'zod';

const appSession = createAppSession({
  browserSessionCookieName: 'attio_browser_session',
  appSessionCookieName: 'attio_installation_session',
  installationIdSchema: z.string(),
  tokenInstallationIdSchema: z.string().uuid().or(z.string()),
  getSecret: () =>
    env.APP_SESSION_SECRET ??
    env.ATTIO_OAUTH_STATE_SECRET ??
    (env.NODE_ENV === 'test'
      ? 'test-app-session-secret-0123456789abcdef'
      : null),
  getFrontendAppUrl: () => env.FRONTEND_APP_URL,
});

export const {
  BROWSER_SESSION_COOKIE_NAME,
  APP_SESSION_COOKIE_NAME,
  hasAppSessionConfig,
  getOrCreateBrowserSessionId,
  getBrowserSessionId,
  setInstallationSessionCookie,
  clearInstallationSessionCookie,
  getAuthorizedInstallationId,
  authorizeInstallationRequest,
  createMagicAccessToken,
  createInstallationSessionToken,
  verifyMagicAccessToken,
  buildMagicAccessLink,
} = appSession;
