import { db } from '@server/db/client';
import {
  type NewNumberFilterEntry,
  numberFilterEntries,
} from '@server/db/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function listNumberFilterEntries(installationId: string) {
  return db
    .select()
    .from(numberFilterEntries)
    .where(eq(numberFilterEntries.installationId, installationId))
    .orderBy(desc(numberFilterEntries.createdAt));
}

export async function findNumberFilterEntryByNormalizedPhone(
  installationId: string,
  normalizedPhone: string,
) {
  const [entry] = await db
    .select()
    .from(numberFilterEntries)
    .where(
      and(
        eq(numberFilterEntries.installationId, installationId),
        eq(numberFilterEntries.normalizedPhone, normalizedPhone),
      ),
    )
    .limit(1);

  return entry ?? null;
}

export async function createNumberFilterEntry(
  values: Omit<NewNumberFilterEntry, 'id'>,
) {
  const [entry] = await db
    .insert(numberFilterEntries)
    .values(values)
    .returning();

  return entry;
}

export async function deleteNumberFilterEntry(
  installationId: string,
  id: number,
) {
  const [deleted] = await db
    .delete(numberFilterEntries)
    .where(
      and(
        eq(numberFilterEntries.id, id),
        eq(numberFilterEntries.installationId, installationId),
      ),
    )
    .returning();

  return deleted ?? null;
}
