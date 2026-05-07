import {
  and,
  asc,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  lte,
  ne,
  or,
} from 'drizzle-orm';

import { db } from '@server/db/client';
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

async function scrubWhatsappMessageContent(
  id: number,
  values: Partial<
    Pick<NewWhatsappMessage, 'syncState' | 'nextRetryAt' | 'lastSyncError'>
  >,
) {
  const [existing] = await db
    .select()
    .from(whatsappMessages)
    .where(eq(whatsappMessages.id, id))
    .limit(1);

  if (!existing) {
    return null;
  }

  const syncState = values.syncState ?? existing.syncState;
  const lastSyncError =
    values.lastSyncError === undefined
      ? existing.lastSyncError
      : values.lastSyncError;

  const [message] = await db
    .update(whatsappMessages)
    .set({
      syncState,
      nextRetryAt: values.nextRetryAt ?? null,
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

export async function scrubProcessedWhatsappMessages() {
  const rows = await db
    .select()
    .from(whatsappMessages)
    .where(
      or(
        eq(whatsappMessages.syncState, 'synced'),
        eq(whatsappMessages.syncState, 'filtered'),
      ),
    );

  return Promise.all(
    rows.map((message) => scrubWhatsappMessageContent(message.id, {})),
  );
}

export async function scrubExpiredWhatsappMessages(cutoffIso: string) {
  const rows = await db
    .select()
    .from(whatsappMessages)
    .where(
      and(
        or(
          eq(whatsappMessages.syncState, 'pending'),
          eq(whatsappMessages.syncState, 'failed'),
        ),
        lte(whatsappMessages.createdAt, cutoffIso),
      ),
    );

  return Promise.all(
    rows.map((message) =>
      scrubWhatsappMessageContent(message.id, {
        syncState: 'filtered',
        nextRetryAt: null,
        lastSyncError: 'retention_expired',
      }),
    ),
  );
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

  return message ?? null;
}

export type WhatsappMessageRecord = WhatsappMessage;
