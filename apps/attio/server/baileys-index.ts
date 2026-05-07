import { env } from '@server/env';
import { APP_SERVICE_NAME } from '@server/lib/app-identity';
import { restoreBaileysSessions } from '@server/services/baileys-session';
import { baileysApp } from './baileys-app';

console.log(
  `${APP_SERVICE_NAME} Baileys service listening on http://localhost:${env.BAILEYS_SERVICE_PORT}`,
);

Bun.serve({
  port: env.BAILEYS_SERVICE_PORT,
  fetch: baileysApp.fetch,
});

void restoreBaileysSessions()
  .then(({ attempted, restored }) => {
    if (attempted > 0) {
      console.log(
        `Restored ${restored}/${attempted} persisted Baileys session(s)`,
      );
    }
  })
  .catch((error) => {
    console.error('Failed to restore persisted Baileys sessions', error);
  });
