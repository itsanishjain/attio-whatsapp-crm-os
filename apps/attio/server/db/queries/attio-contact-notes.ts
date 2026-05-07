import { db } from '@server/db/client';
import { type NewAttioContactNote, attioContactNotes } from '@server/db/schema';
import { and, eq, sql } from 'drizzle-orm';

export async function findAttioContactNote(input: {
  installationId: string;
  conversationKey: string;
}) {
  const [note] = await db
    .select()
    .from(attioContactNotes)
    .where(
      and(
        eq(attioContactNotes.installationId, input.installationId),
        eq(attioContactNotes.conversationKey, input.conversationKey),
      ),
    )
    .limit(1);

  return note ?? null;
}

export async function upsertAttioContactNote(values: NewAttioContactNote) {
  const [note] = await db
    .insert(attioContactNotes)
    .values(values)
    .onConflictDoUpdate({
      target: [
        attioContactNotes.installationId,
        attioContactNotes.conversationKey,
      ],
      set: {
        attioRecordId: values.attioRecordId,
        attioNoteId: values.attioNoteId,
        noteTitle: values.noteTitle,
        lastMessageAt: values.lastMessageAt,
        messageCount: values.messageCount,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    })
    .returning();

  return note;
}
