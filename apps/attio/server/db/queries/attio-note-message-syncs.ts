import { db } from '@server/db/client';
import {
  type AttioNoteMessageSync,
  attioNoteMessageSyncs,
} from '@server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

const PROCESSING_STALE_MS = 2 * 60 * 1000;

function isUniqueConstraintError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return lower.includes('unique') || lower.includes('constraint');
}

function isStaleProcessingClaim(sync: AttioNoteMessageSync) {
  if (sync.syncState !== 'processing') {
    return false;
  }

  return Date.now() - new Date(sync.updatedAt).getTime() > PROCESSING_STALE_MS;
}

export async function findAttioNoteMessageSync(input: {
  installationId: string;
  whatsappMessageId: string;
}) {
  const [sync] = await db
    .select()
    .from(attioNoteMessageSyncs)
    .where(
      and(
        eq(attioNoteMessageSyncs.installationId, input.installationId),
        eq(attioNoteMessageSyncs.whatsappMessageId, input.whatsappMessageId),
      ),
    )
    .limit(1);

  return sync ?? null;
}

export async function claimAttioNoteMessageSync(input: {
  installationId: string;
  whatsappMessageId: string;
  conversationKey: string;
}): Promise<
  | { status: 'claimed'; sync: AttioNoteMessageSync }
  | { status: 'already_synced'; sync: AttioNoteMessageSync }
  | { status: 'in_progress'; sync: AttioNoteMessageSync }
> {
  try {
    const [sync] = await db
      .insert(attioNoteMessageSyncs)
      .values({
        installationId: input.installationId,
        whatsappMessageId: input.whatsappMessageId,
        conversationKey: input.conversationKey,
        syncState: 'processing',
        syncAttempts: 1,
      })
      .returning();

    return { status: 'claimed', sync };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  const existing = await findAttioNoteMessageSync(input);

  if (!existing) {
    throw new Error(
      'Attio note message sync claim conflicted but was not found',
    );
  }

  if (existing.syncState === 'synced') {
    return { status: 'already_synced', sync: existing };
  }

  if (
    existing.syncState === 'processing' &&
    !isStaleProcessingClaim(existing)
  ) {
    return { status: 'in_progress', sync: existing };
  }

  const [sync] = await db
    .update(attioNoteMessageSyncs)
    .set({
      conversationKey: input.conversationKey,
      syncState: 'processing',
      syncAttempts: existing.syncAttempts + 1,
      lastSyncError: null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(attioNoteMessageSyncs.id, existing.id))
    .returning();

  return { status: 'claimed', sync };
}

export async function markAttioNoteMessageSyncSynced(input: {
  id: number;
  attioNoteId: string | null;
}) {
  const [sync] = await db
    .update(attioNoteMessageSyncs)
    .set({
      attioNoteId: input.attioNoteId,
      syncState: 'synced',
      lastSyncError: null,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(attioNoteMessageSyncs.id, input.id))
    .returning();

  return sync ?? null;
}

export async function markAttioNoteMessageSyncFailed(input: {
  id: number;
  error: string;
}) {
  const [sync] = await db
    .update(attioNoteMessageSyncs)
    .set({
      syncState: 'failed',
      lastSyncError: input.error,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(attioNoteMessageSyncs.id, input.id))
    .returning();

  return sync ?? null;
}
