import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
} from 'drizzle-orm';

import { db } from '@server/db/client';
import { enqueueSyncJobForMessage } from '@server/db/queries/sync-jobs';
import {
  type NewWhatsappMessage,
  type WhatsappMessage,
  whatsappMessages,
} from '@server/db/schema';

export async function listRecentWhatsappMessages(
  installationId: string,
  limit = 25,
) {
  return db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.installationId, installationId))
    .orderBy(desc(whatsappMessages.sentAt), desc(whatsappMessages.id))
    .limit(limit);
}

export async function findWhatsappMessageByExternalId(
  installationId: string,
  whatsappMessageId: string,
) {
  const [message] = await db
    .select()
    .from(whatsappMessages)
    .where(
      and(
        eq(whatsappMessages.installationId, installationId),
        eq(whatsappMessages.whatsappMessageId, whatsappMessageId),
      ),
    )
    .limit(1);

  return message ?? null;
}

export async function listWhatsappMessagesByIds(ids: number[]) {
  if (ids.length === 0) {
    return [];
  }

  return db
    .select()
    .from(whatsappMessages)
    .where(inArray(whatsappMessages.id, ids));
}

export async function listUnsyncedWhatsappMessages(
  installationId: string,
  limit = 20,
) {
  return db
    .select()
    .from(whatsappMessages)
    .where(
      and(
        eq(whatsappMessages.installationId, installationId),
        ne(whatsappMessages.syncState, 'synced'),
        or(
          eq(whatsappMessages.syncState, 'pending'),
          eq(whatsappMessages.syncState, 'failed'),
        ),
        or(
          isNull(whatsappMessages.nextRetryAt),
          lte(whatsappMessages.nextRetryAt, new Date().toISOString()),
        ),
      ),
    )
    .orderBy(
      asc(whatsappMessages.nextRetryAt),
      asc(whatsappMessages.sentAt),
      asc(whatsappMessages.id),
    )
    .limit(limit);
}

export async function listInstallationIdsWithPendingWhatsappMessages(
  limit = 20,
) {
  const rows = await db
    .selectDistinct({
      installationId: whatsappMessages.installationId,
    })
    .from(whatsappMessages)
    .where(
      and(
        ne(whatsappMessages.syncState, 'synced'),
        or(
          eq(whatsappMessages.syncState, 'pending'),
          eq(whatsappMessages.syncState, 'failed'),
        ),
        or(
          isNull(whatsappMessages.nextRetryAt),
          lte(whatsappMessages.nextRetryAt, new Date().toISOString()),
        ),
      ),
    )
    .limit(limit);

  return rows.map((row) => row.installationId);
}

function hasRetainedWhatsappMessageContent(message: WhatsappMessage) {
  return (
    message.textBody !== null ||
    message.hasMedia ||
    message.mediaType !== null ||
    message.mediaMimeType !== null ||
    message.mediaFileName !== null ||
    message.mediaObjectKey !== null ||
    message.locationLatitude !== null ||
    message.locationLongitude !== null ||
    message.locationName !== null ||
    message.locationAddress !== null ||
    message.rawMessageJson !== null
  );
}

function processedWhatsappMessagesNeedingScrub() {
  return and(
    or(
      eq(whatsappMessages.syncState, 'synced'),
      eq(whatsappMessages.syncState, 'filtered'),
    ),
    or(
      isNotNull(whatsappMessages.textBody),
      eq(whatsappMessages.hasMedia, true),
      isNotNull(whatsappMessages.mediaType),
      isNotNull(whatsappMessages.mediaMimeType),
      isNotNull(whatsappMessages.mediaFileName),
      isNotNull(whatsappMessages.mediaObjectKey),
      isNotNull(whatsappMessages.locationLatitude),
      isNotNull(whatsappMessages.locationLongitude),
      isNotNull(whatsappMessages.locationName),
      isNotNull(whatsappMessages.locationAddress),
      isNotNull(whatsappMessages.rawMessageJson),
      isNotNull(whatsappMessages.nextRetryAt),
      and(
        eq(whatsappMessages.syncState, 'synced'),
        isNotNull(whatsappMessages.lastSyncError),
      ),
    ),
  );
}

function expiredWhatsappMessagesNeedingScrub(cutoffIso: string) {
  return and(
    or(
      eq(whatsappMessages.syncState, 'pending'),
      eq(whatsappMessages.syncState, 'failed'),
    ),
    lte(whatsappMessages.createdAt, cutoffIso),
  );
}

async function scrubWhatsappMessageContent(
  id: number,
  values: Partial<
    Pick<NewWhatsappMessage, 'syncState' | 'nextRetryAt' | 'lastSyncError'>
  >,
  existingMessage?: WhatsappMessage,
) {
  const existing =
    existingMessage ??
    (
      await db
        .select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.id, id))
        .limit(1)
    )[0];

  if (!existing) {
    return null;
  }

  const syncState = values.syncState ?? existing.syncState;
  const lastSyncError =
    values.lastSyncError === undefined
      ? existing.lastSyncError
      : values.lastSyncError;

  const desiredNextRetryAt = values.nextRetryAt ?? null;
  const alreadyScrubbed =
    existing.syncState === syncState &&
    existing.nextRetryAt === desiredNextRetryAt &&
    existing.lastSyncError === lastSyncError &&
    !hasRetainedWhatsappMessageContent(existing);

  if (alreadyScrubbed) {
    return existing;
  }

  const [message] = await db
    .update(whatsappMessages)
    .set({
      syncState,
      nextRetryAt: desiredNextRetryAt,
      lastSyncError,
      textBody: null,
      hasMedia: false,
      mediaType: null,
      mediaMimeType: null,
      mediaFileName: null,
      mediaObjectKey: null,
      locationLatitude: null,
      locationLongitude: null,
      locationName: null,
      locationAddress: null,
      rawMessageJson: null,
    })
    .where(eq(whatsappMessages.id, id))
    .returning();

  return message ?? null;
}

export type ScrubRetainedWhatsappMessagesResult = {
  scrubbed: number;
  hasMore: boolean;
};

async function scrubProcessedWhatsappMessageBatch(limit: number) {
  const rows = await db
    .select()
    .from(whatsappMessages)
    .where(processedWhatsappMessagesNeedingScrub())
    .orderBy(asc(whatsappMessages.id))
    .limit(limit);

  const scrubbed = await Promise.all(
    rows.map((message) => scrubWhatsappMessageContent(message.id, {}, message)),
  );

  return {
    scrubbed: scrubbed.filter((message) => message !== null).length,
    hasMore: rows.length === limit,
  };
}

async function scrubExpiredWhatsappMessageBatch(
  cutoffIso: string,
  limit: number,
) {
  const rows = await db
    .select()
    .from(whatsappMessages)
    .where(expiredWhatsappMessagesNeedingScrub(cutoffIso))
    .orderBy(asc(whatsappMessages.id))
    .limit(limit);

  const scrubbed = await Promise.all(
    rows.map((message) =>
      scrubWhatsappMessageContent(
        message.id,
        {
          syncState: 'filtered',
          nextRetryAt: null,
          lastSyncError: 'retention_expired',
        },
        message,
      ),
    ),
  );

  return {
    scrubbed: scrubbed.filter((message) => message !== null).length,
    hasMore: rows.length === limit,
  };
}

export async function scrubRetainedWhatsappMessages(
  cutoffIso: string,
  batchSize = 200,
): Promise<ScrubRetainedWhatsappMessagesResult> {
  const perBatch = Math.max(1, Math.ceil(batchSize / 2));
  const [processed, expired] = await Promise.all([
    scrubProcessedWhatsappMessageBatch(perBatch),
    scrubExpiredWhatsappMessageBatch(cutoffIso, perBatch),
  ]);

  return {
    scrubbed: processed.scrubbed + expired.scrubbed,
    hasMore: processed.hasMore || expired.hasMore,
  };
}

export async function upsertWhatsappMessage(
  values: NewWhatsappMessage,
): Promise<WhatsappMessage> {
  const [message] = await db
    .insert(whatsappMessages)
    .values(values)
    .onConflictDoUpdate({
      target: [
        whatsappMessages.installationId,
        whatsappMessages.whatsappMessageId,
      ],
      set: {
        chatJid: values.chatJid,
        participantJid: values.participantJid ?? null,
        remotePhone: values.remotePhone,
        normalizedPhone: values.normalizedPhone,
        contactName: values.contactName ?? null,
        direction: values.direction,
        textBody: values.textBody ?? null,
        sentAt: values.sentAt,
        replyToWhatsappMessageId: values.replyToWhatsappMessageId ?? null,
        hasMedia: values.hasMedia ?? false,
        mediaType: values.mediaType ?? null,
        mediaMimeType: values.mediaMimeType ?? null,
        mediaFileName: values.mediaFileName ?? null,
        locationLatitude: values.locationLatitude ?? null,
        locationLongitude: values.locationLongitude ?? null,
        locationName: values.locationName ?? null,
        locationAddress: values.locationAddress ?? null,
        rawMessageJson: values.rawMessageJson,
      },
    })
    .returning();

  await enqueueSyncJobForMessage(message);

  return message;
}

export async function insertWhatsappMessageIfNew(
  values: NewWhatsappMessage,
): Promise<WhatsappMessage | null> {
  const [message] = await db
    .insert(whatsappMessages)
    .values(values)
    .onConflictDoNothing({
      target: [
        whatsappMessages.installationId,
        whatsappMessages.whatsappMessageId,
      ],
    })
    .returning();

  if (message) {
    await enqueueSyncJobForMessage(message);
  }

  return message ?? null;
}

export async function updateWhatsappMessageSyncState(
  id: number,
  values: Partial<
    Pick<
      NewWhatsappMessage,
      'syncState' | 'syncAttempts' | 'nextRetryAt' | 'lastSyncError'
    >
  >,
) {
  const [message] = await db
    .update(whatsappMessages)
    .set(values)
    .where(eq(whatsappMessages.id, id))
    .returning();

  return message ?? null;
}

export async function markWhatsappMessagePending(
  id: number,
  syncState: 'pending' | 'failed',
  lastSyncError: string | null,
  nextRetryAt: string | null,
) {
  const [message] = await db
    .select({
      syncAttempts: whatsappMessages.syncAttempts,
    })
    .from(whatsappMessages)
    .where(eq(whatsappMessages.id, id))
    .limit(1);

  return updateWhatsappMessageSyncState(id, {
    syncState,
    syncAttempts: (message?.syncAttempts ?? 0) + 1,
    lastSyncError,
    nextRetryAt,
  });
}

export async function markWhatsappMessageSynced(id: number) {
  return scrubWhatsappMessageContent(id, {
    syncState: 'synced',
    nextRetryAt: null,
    lastSyncError: null,
  });
}

export async function markWhatsappMessageFiltered(
  id: number,
  lastSyncError: string | null,
) {
  return scrubWhatsappMessageContent(id, {
    syncState: 'filtered',
    nextRetryAt: null,
    lastSyncError,
  });
}

export async function countUploadedWhatsappMediaForInstallation(
  installationId: string,
) {
  const [result] = await db
    .select({ count: count() })
    .from(whatsappMessages)
    .where(
      and(
        eq(whatsappMessages.installationId, installationId),
        isNotNull(whatsappMessages.mediaObjectKey),
      ),
    );

  return result?.count ?? 0;
}

export async function updateWhatsappMessageMedia(
  installationId: string,
  whatsappMessageId: string,
  mediaObjectKey: string,
) {
  const [message] = await db
    .update(whatsappMessages)
    .set({ mediaObjectKey })
    .where(
      and(
        eq(whatsappMessages.installationId, installationId),
        eq(whatsappMessages.whatsappMessageId, whatsappMessageId),
      ),
    )
    .returning();

  if (message) {
    await enqueueSyncJobForMessage(message);
  }

  return message ?? null;
}

export type WhatsappMessageRecord = WhatsappMessage;
