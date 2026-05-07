import {
  clearInstallationSessionCookie,
  getOrCreateBrowserSessionId,
  setInstallationSessionCookie,
  verifyMagicAccessToken,
} from '@server/lib/app-session';
import { buildPublicUrl } from '@server/lib/public-request-url';
import { Hono } from 'hono';
import { z } from 'zod';

const sessionRestoreQuerySchema = z.object({
  access_token: z.string().min(1).optional(),
  next: z.string().min(1).optional(),
});

function getSafeNextPath(input: string | undefined) {
  if (!input) {
    return '/dashboard';
  }

  if (!input.startsWith('/')) {
    return '/dashboard';
  }

  if (input.startsWith('//')) {
    return '/dashboard';
  }

  return input;
}

export const sessionRoutes = new Hono().get('/restore', async (context) => {
  const query = sessionRestoreQuerySchema.parse(context.req.query());
  const nextPath = getSafeNextPath(query.next);

  if (!query.access_token) {
    clearInstallationSessionCookie(context);
    return context.redirect(
      buildPublicUrl(context, `${nextPath}?session=invalid`),
      302,
    );
  }

  const installationId = verifyMagicAccessToken(query.access_token);

  if (!installationId) {
    clearInstallationSessionCookie(context);
    return context.redirect(
      buildPublicUrl(context, `${nextPath}?session=invalid`),
      302,
    );
  }

  getOrCreateBrowserSessionId(context);
  setInstallationSessionCookie(context, installationId);

  return context.redirect(buildPublicUrl(context, nextPath), 302);
});
