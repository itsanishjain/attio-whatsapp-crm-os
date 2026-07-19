import { z } from 'zod';

const optionalString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional();

const envSchema = z.object({
  BAILEYS_INGEST_TIMING: z
    .preprocess((val) => val === 'true', z.boolean())
    .default(false),
  DATABASE_URL: z.string().min(1).default('file:local.db'),
  FRONTEND_APP_URL: z.string().url().default('http://localhost:5175'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_SESSION_SECRET: optionalString,
  APP_DATA_ENCRYPTION_KEY: optionalString,
  TURSO_AUTH_TOKEN: optionalString,
  BAILEYS_SERVICE_URL: z.string().url().default('http://127.0.0.1:3001'),
  BAILEYS_SERVICE_PORT: z.coerce.number().int().positive().default(3001),
  BAILEYS_SERVICE_TOKEN: optionalString,
  WABA_RELAY_SECRET: z.string().min(1),
  WABA_ONBOARDING_URL: z.string().url(),
  R2_ACCOUNT_ID: optionalString,
  R2_ACCESS_KEY_ID: optionalString,
  R2_SECRET_ACCESS_KEY: optionalString,
  R2_BUCKET_NAME: optionalString,
  R2_PUBLIC_URL: optionalString,
  MEDIA_UPLOAD_MAX_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(100 * 1024 * 1024),
  MEDIA_UPLOAD_MAX_FILES_PER_INSTALLATION: z.coerce
    .number()
    .int()
    .positive()
    .default(100),
  MEDIA_UPLOAD_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  MEDIA_UPLOAD_MAX_RETRIES: z.coerce.number().int().min(0).max(10).default(2),
  MEDIA_UPLOAD_RETRY_BASE_MS: z.coerce.number().int().positive().default(5_000),
  MEDIA_UPLOAD_CONCURRENCY: z.coerce.number().int().positive().default(3),
  MEDIA_TRANSCODE_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(30_000),
  MEDIA_TRANSCODE_MAX_DURATION_SECONDS: z.coerce
    .number()
    .int()
    .positive()
    .default(30 * 60),
  WHATSAPP_MESSAGE_RETENTION_HOURS: z.coerce
    .number()
    .int()
    .positive()
    .default(24),
  ATTIO_CLIENT_ID: optionalString,
  ATTIO_CLIENT_SECRET: optionalString,
  ATTIO_REDIRECT_URI: optionalString,
  ATTIO_SCOPES: z
    .string()
    .min(1)
    .default(
      'object_configuration:read-write record_permission:read note:read-write',
    ),
  ATTIO_OAUTH_AUTHORIZE_URL: z
    .string()
    .url()
    .default('https://app.attio.com/authorize'),
  ATTIO_OAUTH_TOKEN_URL: z
    .string()
    .url()
    .default('https://app.attio.com/oauth/token'),
  ATTIO_OAUTH_STATE_SECRET: optionalString,
  ATTIO_API_URL: z.string().url().default('https://api.attio.com/v2'),
  BYPASS_GROUP_SYNC_SETTINGS: z
    .preprocess((val) => val === 'true', z.boolean())
    .default(false),
});

export const env = envSchema.parse(process.env);
