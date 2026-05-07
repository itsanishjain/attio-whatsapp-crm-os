import { randomUUID } from 'node:crypto';
import { and, count, desc, eq, sql } from 'drizzle-orm';

import { db } from '@server/db/client';
import {
  type Installation,
  type NewInstallation,
  installations,
} from '@server/db/schema';
import {
  decryptSensitiveValue,
  encryptSensitiveValue,
} from '@server/lib/encryption';

type CreateInstallationInput = Omit<NewInstallation, 'id'> & {
  id?: string;
};

type UpsertInstallationInput = Pick<
  NewInstallation,
  'provider' | 'providerAccountId' | 'authJson' | 'status' | 'settingsJson'
>;

function decryptInstallationAuth<T extends Installation | null>(
  installation: T,
): T {
  if (!installation) {
    return installation;
  }

  return {
    ...installation,
    authJson: decryptSensitiveValue(installation.authJson),
  };
}

export async function countInstallations() {
  const [result] = await db.select({ count: count() }).from(installations);
  return result.count;
}

export async function findInstallationById(id: string) {
  const [installation] = await db
    .select()
    .from(installations)
    .where(eq(installations.id, id))
    .limit(1);

  return decryptInstallationAuth(installation ?? null);
}

export async function findLatestInstallationByProvider(provider: string) {
  const [installation] = await db
    .select()
    .from(installations)
    .where(eq(installations.provider, provider))
    .orderBy(desc(installations.updatedAt), desc(installations.id))
    .limit(1);

  return decryptInstallationAuth(installation ?? null);
}

export async function findInstallationByProviderAccountId(
  provider: string,
  providerAccountId: string,
) {
  const [installation] = await db
    .select()
    .from(installations)
    .where(
      and(
        eq(installations.provider, provider),
        eq(installations.providerAccountId, providerAccountId),
      ),
    )
    .limit(1);

  return decryptInstallationAuth(installation ?? null);
}

export async function createInstallation(values: CreateInstallationInput) {
  const [installation] = await db
    .insert(installations)
    .values({
      ...values,
      id: values.id ?? randomUUID(),
      authJson: encryptSensitiveValue(values.authJson),
    })
    .returning();

  return decryptInstallationAuth(installation);
}

export async function upsertInstallation(values: UpsertInstallationInput) {
  const [installation] = await db
    .insert(installations)
    .values({
      ...values,
      id: randomUUID(),
      authJson: encryptSensitiveValue(values.authJson),
    })
    .onConflictDoUpdate({
      target: [installations.provider, installations.providerAccountId],
      set: {
        authJson: encryptSensitiveValue(values.authJson),
        status: values.status,
        settingsJson: values.settingsJson ?? null,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();

  return decryptInstallationAuth(installation);
}

export async function updateInstallationStatus(
  id: string,
  status: Installation['status'],
) {
  const [installation] = await db
    .update(installations)
    .set({
      status,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(installations.id, id))
    .returning();

  return decryptInstallationAuth(installation ?? null);
}

export async function updateInstallationAuth(
  id: string,
  values: Pick<NewInstallation, 'authJson' | 'settingsJson' | 'status'>,
) {
  const [installation] = await db
    .update(installations)
    .set({
      authJson: encryptSensitiveValue(values.authJson),
      settingsJson: values.settingsJson ?? null,
      status: values.status ?? 'connected',
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(installations.id, id))
    .returning();

  return decryptInstallationAuth(installation ?? null);
}

export async function updateInstallationConnection(
  id: string,
  values: Pick<
    NewInstallation,
    'providerAccountId' | 'authJson' | 'settingsJson' | 'status'
  >,
) {
  const [installation] = await db
    .update(installations)
    .set({
      providerAccountId: values.providerAccountId,
      authJson: encryptSensitiveValue(values.authJson),
      settingsJson: values.settingsJson ?? null,
      status: values.status,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(installations.id, id))
    .returning();

  return decryptInstallationAuth(installation ?? null);
}

export async function updateInstallationSettings(
  id: string,
  settingsJson: string | null,
) {
  const [installation] = await db
    .update(installations)
    .set({
      settingsJson,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(installations.id, id))
    .returning();

  return decryptInstallationAuth(installation ?? null);
}
