/**
 * Generate a magic access link for an installation from the terminal.
 *
 * Usage:
 *   bun scripts/generate-magic-link.ts <installationId>
 *   bun scripts/generate-magic-link.ts <installationId> --base-url https://example.com
 *   bun scripts/generate-magic-link.ts --latest
 *
 * Options:
 *   --base-url <url>   Override the base URL (default: FRONTEND_APP_URL or http://localhost:5175)
 *   --latest           Use the most recent installation instead of specifying an ID
 */

import { createHmac } from 'node:crypto';
import { createClient } from '@libsql/client';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { z } from 'zod';
import * as schema from '../server/db/schema';

const optionalString = z.preprocess((value) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}, z.string().min(1).optional());

const scriptEnvSchema = z.object({
  DATABASE_URL: z.string().min(1).default('file:local.db'),
  TURSO_AUTH_TOKEN: optionalString,
  APP_SESSION_SECRET: optionalString,
  ATTIO_OAUTH_STATE_SECRET: optionalString,
  FRONTEND_APP_URL: optionalString,
});

const envResult = scriptEnvSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('Environment validation failed:');
  for (const issue of envResult.error.issues) {
    console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const scriptEnv = envResult.data;

function getAppSessionSecret(): string {
  const secret =
    scriptEnv.APP_SESSION_SECRET ?? scriptEnv.ATTIO_OAUTH_STATE_SECRET;

  if (!secret || secret.length < 32) {
    console.error(
      'No valid session secret found. Set APP_SESSION_SECRET (or ATTIO_OAUTH_STATE_SECRET) to a value of at least 32 characters.',
    );
    process.exit(1);
  }

  return secret;
}

const MAGIC_LINK_TTL_SECONDS = 60 * 60 * 24 * 30;

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString('base64url');
}

function signValue(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function createMagicAccessToken(installationId: string): string {
  const secret = getAppSessionSecret();
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    type: 'magic-access' as const,
    installationId,
    iat: now,
    exp: now + MAGIC_LINK_TTL_SECONDS,
  };

  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signValue(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

function usage(): never {
  console.error(
    'Usage:\n' +
      '  bun scripts/generate-magic-link.ts <installationId> [--base-url URL]\n' +
      '  bun scripts/generate-magic-link.ts --latest [--base-url URL]',
  );
  process.exit(1);
}

let installationId: string | null = null;
let useLatest = false;
let baseUrl: string | null = null;

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--base-url') {
    baseUrl = args[++i];
    if (!baseUrl) usage();
    continue;
  }

  if (arg === '--latest') {
    useLatest = true;
    continue;
  }

  if (arg === '--help' || arg === '-h') {
    usage();
  }

  if (!arg.startsWith('--') && !installationId) {
    installationId = arg;
  }
}

if (!installationId && !useLatest) {
  usage();
}

const client = createClient({
  url: scriptEnv.DATABASE_URL,
  authToken: scriptEnv.TURSO_AUTH_TOKEN,
});
const db = drizzle(client, { schema });

async function main() {
  let installation: typeof schema.installations.$inferSelect | null = null;

  if (useLatest) {
    const [row] = await db
      .select()
      .from(schema.installations)
      .orderBy(
        desc(schema.installations.updatedAt),
        desc(schema.installations.id),
      )
      .limit(1);

    installation = row ?? null;

    if (!installation) {
      console.error('No installations found in the database.');
      process.exit(1);
    }

    console.error(
      `Using latest installation: ${installation.id} (${installation.provider}/${installation.providerAccountId})`,
    );
  } else if (installationId) {
    const [row] = await db
      .select()
      .from(schema.installations)
      .where(eq(schema.installations.id, installationId))
      .limit(1);

    installation = row ?? null;

    if (!installation) {
      console.error(
        `Installation "${installationId}" not found in the database.`,
      );

      const all = await db
        .select({
          id: schema.installations.id,
          provider: schema.installations.provider,
          providerAccountId: schema.installations.providerAccountId,
        })
        .from(schema.installations)
        .orderBy(desc(schema.installations.updatedAt))
        .limit(10);

      if (all.length > 0) {
        console.error('\nAvailable installations:');
        for (const row of all) {
          console.error(
            `  ${row.id}  (${row.provider}/${row.providerAccountId})`,
          );
        }
      }

      process.exit(1);
    }
  }

  const token = createMagicAccessToken(installation.id);

  const resolvedBaseUrl = (
    baseUrl ??
    scriptEnv.FRONTEND_APP_URL ??
    'http://localhost:5175'
  ).replace(/\/$/, '');
  const restoreUrl = new URL('/api/session/restore', resolvedBaseUrl);
  restoreUrl.searchParams.set('access_token', token);
  restoreUrl.searchParams.set('next', '/dashboard');

  const link = restoreUrl.toString();
  const expUnix = Math.floor(Date.now() / 1000) + MAGIC_LINK_TTL_SECONDS;

  console.log(link);

  console.error(`\nInstallation: ${installation.id}`);
  console.error(
    `Provider:     ${installation.provider}/${installation.providerAccountId}`,
  );
  console.error(`Status:       ${installation.status}`);
  console.error(`ExpiresAt:    ${new Date(expUnix * 1000).toISOString()}`);
  console.error(`TTL:          ${MAGIC_LINK_TTL_SECONDS / 86400} days`);

  client.close();
}

main().catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : error);
  process.exit(1);
});
