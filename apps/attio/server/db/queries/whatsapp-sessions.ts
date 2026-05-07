import { and, count, eq, ne, sql } from 'drizzle-orm';

import { db } from '@server/db/client';
import { type NewWhatsappSession, whatsappSessions } from '@server/db/schema';

export async function countWhatsappSessions() {
  const [result] = await db.select({ count: count() }).from(whatsappSessions);
  return result.count;
}

export async function findWhatsappSessionByInstallationId(
  installationId: string,
) {
  const [session] = await db
    .select()
    .from(whatsappSessions)
    .where(eq(whatsappSessions.installationId, installationId))
    .limit(1);

  return session ?? null;
}

export async function findWhatsappSessionsWithStoredAuthState() {
  const { whatsappSessionCreds } = await import('@server/db/schema');

  const rows = await db
    .select({
      installationId: whatsappSessions.installationId,
      recoveryState: whatsappSessions.recoveryState,
    })
    .from(whatsappSessions)
    .innerJoin(
      whatsappSessionCreds,
      eq(whatsappSessionCreds.installationId, whatsappSessions.installationId),
    )
    .where(
      and(
        eq(whatsappSessions.needsRelink, false),
        ne(whatsappSessions.recoveryState, 'relink_required'),
      ),
    );

  return rows;
}

export async function upsertWhatsappSession(values: NewWhatsappSession) {
  const optionalFields: Partial<NewWhatsappSession> = {};

  if (values.phoneNumber !== undefined) {
    optionalFields.phoneNumber = values.phoneNumber;
  }
  if (values.displayName !== undefined) {
    optionalFields.displayName = values.displayName;
  }
  if (values.needsRelink !== undefined) {
    optionalFields.needsRelink = values.needsRelink;
  }
  if (values.recoveryState !== undefined) {
    optionalFields.recoveryState = values.recoveryState;
  }
  if (values.disconnectCode !== undefined) {
    optionalFields.disconnectCode = values.disconnectCode;
  }
  if (values.reconnectAttempts !== undefined) {
    optionalFields.reconnectAttempts = values.reconnectAttempts;
  }
  if (values.lastOpenAt !== undefined) {
    optionalFields.lastOpenAt = values.lastOpenAt;
  }
  if (values.lastDisconnectAt !== undefined) {
    optionalFields.lastDisconnectAt = values.lastDisconnectAt;
  }
  if (values.lastErrorJson !== undefined) {
    optionalFields.lastErrorJson = values.lastErrorJson;
  }
  if (values.lastSeenAt !== undefined) {
    optionalFields.lastSeenAt = values.lastSeenAt;
  }

  const [session] = await db
    .insert(whatsappSessions)
    .values(values)
    .onConflictDoUpdate({
      target: whatsappSessions.installationId,
      set: {
        status: values.status ?? 'disconnected',
        updatedAt: sql`CURRENT_TIMESTAMP`,
        ...optionalFields,
      },
    })
    .returning();

  return session;
}
