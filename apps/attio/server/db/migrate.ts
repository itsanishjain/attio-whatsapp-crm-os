import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/libsql/migrator';

import { APP_SERVICE_NAME } from '@server/lib/app-identity';
import { db } from './client';

const migrationsFolder = fileURLToPath(
  new URL('../../drizzle', import.meta.url),
);

await migrate(db, {
  migrationsFolder,
});

console.log(`${APP_SERVICE_NAME} database migrations applied`);
