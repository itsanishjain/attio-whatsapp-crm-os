import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

import { env } from '@server/env';

import * as schema from './schema';

const client = createClient({
  url: env.DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export async function pingDatabase() {
  await client.execute('select 1');
}
