import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '@server/env';
import { z } from 'zod';

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().min(1).optional(),
  scope: z.string().optional(),
});

const statePayloadSchema = z.object({
  iat: z.number().int().positive(),
  nonce: z.string().min(1),
  sid: z.string().min(1),
  installationId: z.string().optional(),
});

const oauthWindowMs = 10 * 60 * 1000;

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function getStateSecret() {
  const secret = env.ATTIO_OAUTH_STATE_SECRET ?? env.APP_SESSION_SECRET;

  if (!secret) {
    throw new Error('Attio OAuth state secret is not configured');
  }

  return secret;
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getStateSecret())
    .update(encodedPayload)
    .digest('base64url');
}

export function hasAttioOauthConfig() {
  return Boolean(
    env.ATTIO_CLIENT_ID &&
      env.ATTIO_CLIENT_SECRET &&
      env.ATTIO_REDIRECT_URI &&
      (env.ATTIO_OAUTH_STATE_SECRET || env.APP_SESSION_SECRET),
  );
}

export function createAttioOauthState(
  sessionId: string,
  installationId?: string | null,
  now = Date.now(),
) {
  const payload = statePayloadSchema.parse({
    iat: now,
    nonce: randomBytes(16).toString('hex'),
    sid: sessionId,
    installationId: installationId ?? undefined,
  });
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));

  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

export function verifyAttioOauthState(state: string, now = Date.now()) {
  const [encodedPayload, signature] = state.split('.');

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  if (
    !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  const payload = statePayloadSchema.parse(
    JSON.parse(decodeBase64Url(encodedPayload)),
  );

  if (now - payload.iat > oauthWindowMs) {
    return null;
  }

  return payload;
}

export function buildAttioAuthorizationUrl(state: string) {
  if (!env.ATTIO_CLIENT_ID || !env.ATTIO_REDIRECT_URI) {
    throw new Error('Attio OAuth is not fully configured');
  }

  const authorizationUrl = new URL(env.ATTIO_OAUTH_AUTHORIZE_URL);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('client_id', env.ATTIO_CLIENT_ID);
  authorizationUrl.searchParams.set('redirect_uri', env.ATTIO_REDIRECT_URI);
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('scope', env.ATTIO_SCOPES);

  return authorizationUrl.toString();
}

export async function exchangeAttioAuthorizationCode(code: string) {
  if (
    !env.ATTIO_CLIENT_ID ||
    !env.ATTIO_CLIENT_SECRET ||
    !env.ATTIO_REDIRECT_URI
  ) {
    throw new Error('Attio OAuth is not fully configured');
  }

  const response = await fetch(env.ATTIO_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.ATTIO_REDIRECT_URI,
      client_id: env.ATTIO_CLIENT_ID,
      client_secret: env.ATTIO_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Attio token exchange failed with ${response.status}: ${body}`,
    );
  }

  return tokenResponseSchema.parse(await response.json());
}
