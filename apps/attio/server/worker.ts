import {
  type ClaimedSyncJob,
  claimReadySyncJobs,
  markSyncJobRetryableFailure,
  repairMissingSyncJobs,
} from '@server/db/queries/sync-jobs';
import { scrubRetainedWhatsappMessages } from '@server/db/queries/whatsapp-messages';
import { env } from '@server/env';
import { syncClaimedAttioMessageJobs } from '@server/services/attio-sync';

const POLL_INTERVAL_MS = env.NODE_ENV === 'test' ? 1_000 : 5_000;
const SCRUB_INTERVAL_MS = env.NODE_ENV === 'test' ? 1_000 : 5 * 60_000;
const SCRUB_INTERVAL_MAX_MS = env.NODE_ENV === 'test' ? 5_000 : 60 * 60_000;
const SCRUB_BATCH_SIZE = 200;
const REPAIR_INTERVAL_MS = env.NODE_ENV === 'test' ? 30_000 : 15 * 60_000;
const JOB_BATCH_SIZE = 100;
const REPAIR_BATCH_SIZE = 500;
const WORKER_ID = `attio-sync-worker-${process.pid}-${Math.random()
  .toString(36)
  .slice(2)}`;

let isRunning = false;
let isShuttingDown = false;
let lastScrubStartedAt = 0;
let currentScrubIntervalMs = SCRUB_INTERVAL_MS;
let lastRepairStartedAt = 0;

function groupJobsByInstallation(jobs: ClaimedSyncJob[]) {
  const jobsByInstallation = new Map<string, ClaimedSyncJob[]>();

  for (const job of jobs) {
    const installationJobs = jobsByInstallation.get(job.installationId);
    if (installationJobs) {
      installationJobs.push(job);
    } else {
      jobsByInstallation.set(job.installationId, [job]);
    }
  }

  return jobsByInstallation;
}

async function markJobsRetryableAfterGroupFailure(
  jobs: ClaimedSyncJob[],
  error: unknown,
) {
  const errorMessage =
    error instanceof Error ? error.message : 'Unknown worker sync error';
  const nextRunAt = new Date(Date.now() + 60_000).toISOString();

  await Promise.all(
    jobs.map((job) =>
      markSyncJobRetryableFailure(job, errorMessage, nextRunAt),
    ),
  );
}

async function runScrubTick() {
  const cutoff = new Date(
    Date.now() - env.WHATSAPP_MESSAGE_RETENTION_HOURS * 60 * 60 * 1000,
  ).toISOString();
  const { scrubbed, hasMore } = await scrubRetainedWhatsappMessages(
    cutoff,
    SCRUB_BATCH_SIZE,
  );

  if (scrubbed > 0 || hasMore) {
    currentScrubIntervalMs = SCRUB_INTERVAL_MS;
    if (scrubbed > 0) {
      console.log(
        `[worker] Scrubbed content from ${scrubbed} retained WhatsApp message row(s)`,
      );
    }
    return;
  }

  currentScrubIntervalMs = Math.min(
    currentScrubIntervalMs * 2,
    SCRUB_INTERVAL_MAX_MS,
  );
}

async function repairMissingJobsIfDue(now: number) {
  if (
    lastRepairStartedAt !== 0 &&
    now - lastRepairStartedAt < REPAIR_INTERVAL_MS
  ) {
    return;
  }

  lastRepairStartedAt = now;
  const repaired = await repairMissingSyncJobs(REPAIR_BATCH_SIZE);

  if (repaired > 0) {
    console.log(`[worker] Repaired ${repaired} missing sync job(s)`);
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
      now - lastScrubStartedAt >= currentScrubIntervalMs
    ) {
      lastScrubStartedAt = now;
      await runScrubTick();
    }

    await repairMissingJobsIfDue(now);

    const jobs = await claimReadySyncJobs(JOB_BATCH_SIZE, WORKER_ID);

    if (jobs.length === 0) {
      return;
    }

    const jobsByInstallation = groupJobsByInstallation(jobs);

    console.log(
      `[worker] Claimed ${jobs.length} sync job(s) across ${jobsByInstallation.size} installation(s)`,
    );

    await Promise.all(
      Array.from(jobsByInstallation.entries()).map(
        async ([installationId, installationJobs]) => {
          try {
            await syncClaimedAttioMessageJobs(installationId, installationJobs);
          } catch (error) {
            await markJobsRetryableAfterGroupFailure(installationJobs, error);
            console.error(
              `[worker] Attio sync failed for installation ${installationId}`,
              error,
            );
          }
        },
      ),
    );
  } catch (error) {
    console.error('[worker] Attio sync tick failed entirely', error);
  } finally {
    isRunning = false;
  }
}

console.log(
  `[worker] Polling sync_jobs every ${POLL_INTERVAL_MS}ms (${env.NODE_ENV} mode) as ${WORKER_ID}`,
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
