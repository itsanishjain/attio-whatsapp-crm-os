import {
  scrubExpiredWhatsappMessages,
  scrubProcessedWhatsappMessages,
} from '@server/db/queries/whatsapp-messages';
import { env } from '@server/env';
import {
  listInstallationIdsWithPendingAttioMessages,
  syncPendingAttioMessages,
} from '@server/services/attio-sync';

const POLL_INTERVAL_MS = env.NODE_ENV === 'test' ? 1_000 : 5_000;
const SCRUB_INTERVAL_MS = env.NODE_ENV === 'test' ? 1_000 : 5 * 60_000;
const INSTALLATION_BATCH_SIZE = 25;
const MESSAGE_BATCH_SIZE = 25;

let isRunning = false;
let isShuttingDown = false;
let lastScrubStartedAt = 0;

async function scrubRetainedWhatsappMessages() {
  const cutoff = new Date(
    Date.now() - env.WHATSAPP_MESSAGE_RETENTION_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const [processed, expired] = await Promise.all([
    scrubProcessedWhatsappMessages(),
    scrubExpiredWhatsappMessages(cutoff),
  ]);
  const scrubbed = processed.length + expired.length;

  if (scrubbed > 0) {
    console.log(
      `[worker] Scrubbed content from ${scrubbed} retained WhatsApp message row(s)`,
    );
  }
}

async function runWorkerTick() {
  if (isRunning || isShuttingDown) {
    return;
  }

  isRunning = true;

  try {
    const now = Date.now();
    if (
      lastScrubStartedAt === 0 ||
      now - lastScrubStartedAt >= SCRUB_INTERVAL_MS
    ) {
      lastScrubStartedAt = now;
      await scrubRetainedWhatsappMessages();
    }

    const installationIds = await listInstallationIdsWithPendingAttioMessages(
      INSTALLATION_BATCH_SIZE,
    );

    if (installationIds.length === 0) {
      return;
    }

    console.log(
      `[worker] Found ${installationIds.length} installation(s) with pending Attio sync work`,
    );

    await Promise.all(
      installationIds.map(async (installationId) => {
        try {
          await syncPendingAttioMessages(installationId, MESSAGE_BATCH_SIZE);
        } catch (error) {
          console.error(
            `[worker] Attio sync failed for installation ${installationId}`,
            error,
          );
        }
      }),
    );
  } catch (error) {
    console.error('[worker] Attio sync tick failed entirely', error);
  } finally {
    isRunning = false;
  }
}

console.log(
  `[worker] Polling pending Attio sync work every ${POLL_INTERVAL_MS}ms (${env.NODE_ENV} mode)`,
);

void runWorkerTick();

const intervalId = setInterval(() => {
  void runWorkerTick();
}, POLL_INTERVAL_MS);

async function shutdown(signal: string) {
  console.log(`\n[worker] Received ${signal}. Starting graceful shutdown...`);
  isShuttingDown = true;
  clearInterval(intervalId);

  let attempts = 0;
  while (isRunning && attempts < 30) {
    console.log(
      `[worker] Waiting for active Attio sync to finish... (${30 - attempts}s remaining)`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
    attempts += 1;
  }

  if (isRunning) {
    console.error('[worker] Force quitting! Attio sync took too long.');
    process.exit(1);
  }

  console.log('[worker] Successfully shut down. Goodbye!');
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
