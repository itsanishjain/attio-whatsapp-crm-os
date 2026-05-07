import { db } from '@server/db/client';
import { whatsappSessionCreds, whatsappSessionKeys } from '@server/db/schema';
import {
  decryptSensitiveValue,
  encryptSensitiveValue,
} from '@server/lib/encryption';
import { and, eq, inArray, sql } from 'drizzle-orm';

export async function findWhatsappSessionCredsByInstallationId(
  installationId: string,
) {
  const [row] = await db
    .select()
    .from(whatsappSessionCreds)
    .where(eq(whatsappSessionCreds.installationId, installationId))
    .limit(1);

  return row
    ? { ...row, credsJson: decryptSensitiveValue(row.credsJson) }
    : null;
}

export async function upsertWhatsappSessionCreds(
  installationId: string,
  credsJson: string,
) {
  await db
    .insert(whatsappSessionCreds)
    .values({ installationId, credsJson: encryptSensitiveValue(credsJson) })
    .onConflictDoUpdate({
      target: whatsappSessionCreds.installationId,
      set: {
        credsJson: encryptSensitiveValue(credsJson),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
}

export async function findWhatsappSessionKeysByIds(
  installationId: string,
  category: string,
  keyIds: string[],
) {
  if (keyIds.length === 0) {
    return [];
  }

  const rows = await db
    .select()
    .from(whatsappSessionKeys)
    .where(
      and(
        eq(whatsappSessionKeys.installationId, installationId),
        eq(whatsappSessionKeys.category, category),
        inArray(whatsappSessionKeys.keyId, keyIds),
      ),
    );

  return rows.map((row) => ({
    ...row,
    valueJson: decryptSensitiveValue(row.valueJson),
  }));
}

export async function upsertWhatsappSessionKeys(
  installationId: string,
  category: string,
  entries: Array<{ keyId: string; valueJson: string }>,
) {
  if (entries.length === 0) {
    return;
  }

  await db
    .insert(whatsappSessionKeys)
    .values(
      entries.map((entry) => ({
        installationId,
        category,
        keyId: entry.keyId,
        valueJson: encryptSensitiveValue(entry.valueJson),
      })),
    )
    .onConflictDoUpdate({
      target: [
        whatsappSessionKeys.installationId,
        whatsappSessionKeys.category,
        whatsappSessionKeys.keyId,
      ],
      set: {
        valueJson: sql`excluded.value_json`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
}

export async function deleteWhatsappSessionKeys(
  installationId: string,
  category: string,
  keyIds: string[],
) {
  if (keyIds.length === 0) {
    return;
  }

  await db
    .delete(whatsappSessionKeys)
    .where(
      and(
        eq(whatsappSessionKeys.installationId, installationId),
        eq(whatsappSessionKeys.category, category),
        inArray(whatsappSessionKeys.keyId, keyIds),
      ),
    );
}

export async function clearWhatsappSessionAuthState(installationId: string) {
  await Promise.all([
    db
      .delete(whatsappSessionKeys)
      .where(eq(whatsappSessionKeys.installationId, installationId)),
    db
      .delete(whatsappSessionCreds)
      .where(eq(whatsappSessionCreds.installationId, installationId)),
  ]);
}
