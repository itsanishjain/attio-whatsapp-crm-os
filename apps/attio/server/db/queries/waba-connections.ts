import { and, eq } from 'drizzle-orm';

import { db } from '@server/db/client';
import {
  type NewWabaConnection,
  type WabaConnection,
  wabaConnections,
} from '@server/db/schema';

export async function findWabaConnectionByPhoneNumberId(phoneNumberId: string) {
  const [connection] = await db
    .select()
    .from(wabaConnections)
    .where(eq(wabaConnections.phoneNumberId, phoneNumberId))
    .limit(1);

  return connection ?? null;
}

export async function findWabaConnectionByWabaId(wabaId: string) {
  const [connection] = await db
    .select()
    .from(wabaConnections)
    .where(eq(wabaConnections.wabaId, wabaId))
    .limit(1);

  return connection ?? null;
}

export async function findConnectedWabaConnectionByInstallationId(
  installationId: string,
) {
  const [connection] = await db
    .select()
    .from(wabaConnections)
    .where(
      and(
        eq(wabaConnections.installationId, installationId),
        eq(wabaConnections.status, 'connected'),
      ),
    )
    .limit(1);

  return connection ?? null;
}

export async function upsertWabaConnection(
  values: NewWabaConnection,
): Promise<WabaConnection> {
  const now = new Date().toISOString();
  const [connection] = await db
    .insert(wabaConnections)
    .values({
      ...values,
      connectedAt: values.connectedAt ?? now,
    })
    .onConflictDoUpdate({
      target: [wabaConnections.phoneNumberId],
      set: {
        installationId: values.installationId,
        wabaId: values.wabaId,
        displayPhoneNumber: values.displayPhoneNumber ?? null,
        verifiedName: values.verifiedName ?? null,
        status: values.status ?? 'connected',
        connectedAt: values.connectedAt ?? now,
        updatedAt: now,
      },
    })
    .returning();

  return connection;
}

export async function disconnectWabaConnection(input: {
  installationId: string;
  phoneNumberId: string;
}) {
  const [connection] = await db
    .update(wabaConnections)
    .set({
      status: 'disconnected',
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(wabaConnections.installationId, input.installationId),
        eq(wabaConnections.phoneNumberId, input.phoneNumberId),
      ),
    )
    .returning();

  return connection ?? null;
}
