import { env } from '@server/env';
import { APP_SERVICE_NAME } from '@server/lib/app-identity';
import { restoreBaileysSessions } from '@server/services/baileys-session';
import { refreshBaileysSocketVersion } from '@server/services/baileys-socket-version';
import { baileysApp } from './baileys-app';

await refreshBaileysSocketVersion();

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
