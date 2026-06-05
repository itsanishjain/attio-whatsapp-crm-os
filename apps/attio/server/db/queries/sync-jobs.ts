import { client, db } from '@server/db/client';
import {
  type NewSyncJob,
  type SyncJob,
  type WhatsappMessage,
  syncJobs,
} from '@server/db/schema';
import { eq, sql } from 'drizzle-orm';

export type SyncJobStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'
  | 'dead';

export type ClaimedSyncJob = {
  id: number;
  installationId: string;
  whatsappMessageRowId: number;
  whatsappMessageId: string;
  status: SyncJobStatus;
  attempts: number;
  nextRunAt: string;
  lockedAt: string | null;
  lockedBy: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

const STALE_LOCK_MS = 10 * 60_000;

function toClaimedSyncJob(row: Record<string, unknown>): ClaimedSyncJob {
  return {
    id: Number(row.id),
    installationId: String(row.installation_id),
    whatsappMessageRowId: Number(row.whatsapp_message_row_id),
    whatsappMessageId: String(row.whatsapp_message_id),
    status: String(row.status) as SyncJobStatus,
    attempts: Number(row.attempts ?? 0),
    nextRunAt: String(row.next_run_at),
    lockedAt: row.locked_at === null ? null : String(row.locked_at),
    lockedBy: row.locked_by === null ? null : String(row.locked_by),
    lastError: row.last_error === null ? null : String(row.last_error),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function shouldEnqueueSyncJob(message: WhatsappMessage) {
  return message.syncState === 'pending' || message.syncState === 'failed';
}

export async function enqueueSyncJobForMessage(message: WhatsappMessage) {
  if (!shouldEnqueueSyncJob(message)) {
    return null;
  }

  const values: NewSyncJob = {
    installationId: message.installationId,
    whatsappMessageRowId: message.id,
    whatsappMessageId: message.whatsappMessageId,
    status: 'pending',
    attempts: message.syncAttempts,
    nextRunAt: message.nextRetryAt ?? new Date().toISOString(),
  };

  const [job] = await db
    .insert(syncJobs)
    .values(values)
    .onConflictDoUpdate({
      target: [syncJobs.installationId, syncJobs.whatsappMessageId],
      set: {
        whatsappMessageRowId: values.whatsappMessageRowId,
        status: 'pending',
        attempts: values.attempts,
        nextRunAt: values.nextRunAt,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
      setWhere: sql`${syncJobs.status} != 'succeeded' AND ${syncJobs.status} != 'processing'`,
    })
    .returning();

  return job ?? null;
}

export async function claimReadySyncJobs(
  limit: number,
  workerId: string,
): Promise<ClaimedSyncJob[]> {
  if (limit <= 0) {
    return [];
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const staleLockIso = new Date(now.getTime() - STALE_LOCK_MS).toISOString();
  const result = await client.execute({
    sql: `
      update sync_jobs
      set
        status = 'processing',
        locked_at = ?,
        locked_by = ?,
        updated_at = CURRENT_TIMESTAMP
      where id in (
        select id
        from sync_jobs
        where
          (
            status in ('pending', 'failed')
            and next_run_at <= ?
          )
          or (
            status = 'processing'
            and locked_at <= ?
          )
        order by next_run_at asc, id asc
        limit ?
      )
      returning
        id,
        installation_id,
        whatsapp_message_row_id,
        whatsapp_message_id,
        status,
        attempts,
        next_run_at,
        locked_at,
        locked_by,
        last_error,
        created_at,
        updated_at
    `,
    args: [nowIso, workerId, nowIso, staleLockIso, limit],
  });

  return result.rows.map((row) =>
    toClaimedSyncJob(row as Record<string, unknown>),
  );
}

export async function markSyncJobSucceeded(id: number) {
  const [job] = await db
    .update(syncJobs)
    .set({
      status: 'succeeded',
      lockedAt: null,
      lockedBy: null,
      lastError: null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(syncJobs.id, id))
    .returning();

  return job ?? null;
}

export async function markSyncJobRetryableFailure(
  job: Pick<SyncJob, 'id' | 'attempts'>,
  lastError: string,
  nextRunAt: string,
) {
  const [updated] = await db
    .update(syncJobs)
    .set({
      status: 'failed',
      attempts: job.attempts + 1,
      nextRunAt,
      lockedAt: null,
      lockedBy: null,
      lastError,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(syncJobs.id, job.id))
    .returning();

  return updated ?? null;
}

export async function markSyncJobDead(id: number, lastError: string) {
  const [job] = await db
    .update(syncJobs)
    .set({
      status: 'dead',
      lockedAt: null,
      lockedBy: null,
      lastError,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(syncJobs.id, id))
    .returning();

  return job ?? null;
}

export async function repairMissingSyncJobs(limit = 500) {
  if (limit <= 0) {
    return 0;
  }

  const result = await client.execute({
    sql: `
      insert or ignore into sync_jobs (
        installation_id,
        whatsapp_message_row_id,
        whatsapp_message_id,
        status,
        attempts,
        next_run_at,
        created_at,
        updated_at
      )
      select
        m.installation_id,
        m.id,
        m.whatsapp_message_id,
        'pending',
        m.sync_attempts,
        coalesce(m.next_retry_at, CURRENT_TIMESTAMP),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      from whatsapp_messages m
      left join sync_jobs j
        on j.installation_id = m.installation_id
       and j.whatsapp_message_id = m.whatsapp_message_id
      where
        j.id is null
        and m.sync_state in ('pending', 'failed')
      order by coalesce(m.next_retry_at, m.sent_at) asc, m.id asc
      limit ?
    `,
    args: [limit],
  });

  return result.rowsAffected;
}
