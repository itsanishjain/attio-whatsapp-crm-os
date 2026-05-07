import { and, eq } from 'drizzle-orm';

import { db } from '@server/db/client';
import {
  type NewWhatsappContact,
  type WhatsappContact,
  whatsappContacts,
} from '@server/db/schema';

export async function findWhatsappContactByChatJid(
  installationId: string,
  chatJid: string,
) {
  const [contact] = await db
    .select()
    .from(whatsappContacts)
    .where(
      and(
        eq(whatsappContacts.installationId, installationId),
        eq(whatsappContacts.chatJid, chatJid),
      ),
    )
    .limit(1);

  return contact ?? null;
}

export async function upsertWhatsappContact(
  values: NewWhatsappContact,
): Promise<WhatsappContact> {
  const optionalFields: Partial<NewWhatsappContact> = {
    updatedAt: new Date().toISOString(),
  };

  if (values.phoneNumber !== undefined) {
    optionalFields.phoneNumber = values.phoneNumber;
  }

  if (values.displayName !== undefined) {
    optionalFields.displayName = values.displayName;
  }

  const [contact] = await db
    .insert(whatsappContacts)
    .values(values)
    .onConflictDoUpdate({
      target: [whatsappContacts.installationId, whatsappContacts.chatJid],
      set: optionalFields,
    })
    .returning();

  return contact;
}
