import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

const timestamps = {
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const installations = sqliteTable(
  'installations',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    authJson: text('auth_json').notNull(),
    status: text('status').notNull().default('pending'),
    settingsJson: text('settings_json'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('installations_provider_account_idx').on(
      table.provider,
      table.providerAccountId,
    ),
    index('installations_status_idx').on(table.status),
  ],
);

export const whatsappSessions = sqliteTable(
  'whatsapp_sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    installationId: text('installation_id')
      .notNull()
      .references(() => installations.id),
    status: text('status').notNull().default('disconnected'),
    phoneNumber: text('phone_number'),
    displayName: text('display_name'),
    needsRelink: integer('needs_relink', { mode: 'boolean' })
      .notNull()
      .default(false),
    recoveryState: text('recovery_state').notNull().default('disconnected'),
    disconnectCode: text('disconnect_code'),
    reconnectAttempts: integer('reconnect_attempts').notNull().default(0),
    lastOpenAt: text('last_open_at'),
    lastDisconnectAt: text('last_disconnect_at'),
    lastErrorJson: text('last_error_json'),
    lastSeenAt: text('last_seen_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('whatsapp_sessions_installation_id_idx').on(
      table.installationId,
    ),
    index('whatsapp_sessions_status_idx').on(table.status),
    index('whatsapp_sessions_phone_number_idx').on(table.phoneNumber),
  ],
);

export const whatsappSessionCreds = sqliteTable('whatsapp_session_creds', {
  installationId: text('installation_id')
    .primaryKey()
    .references(() => installations.id),
  credsJson: text('creds_json').notNull(),
  ...timestamps,
});

export const whatsappSessionKeys = sqliteTable(
  'whatsapp_session_keys',
  {
    installationId: text('installation_id')
      .notNull()
      .references(() => installations.id),
    category: text('category').notNull(),
    keyId: text('key_id').notNull(),
    valueJson: text('value_json').notNull(),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.installationId, table.category, table.keyId],
    }),
    index('whatsapp_session_keys_installation_category_idx').on(
      table.installationId,
      table.category,
    ),
  ],
);

export const wabaConnections = sqliteTable(
  'waba_connections',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    installationId: text('installation_id')
      .notNull()
      .references(() => installations.id),
    wabaId: text('waba_id').notNull(),
    phoneNumberId: text('phone_number_id').notNull(),
    displayPhoneNumber: text('display_phone_number'),
    verifiedName: text('verified_name'),
    status: text('status').notNull().default('connected'),
    connectedAt: text('connected_at'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('waba_connections_installation_phone_idx').on(
      table.installationId,
      table.phoneNumberId,
    ),
    uniqueIndex('waba_connections_phone_number_id_idx').on(table.phoneNumberId),
    index('waba_connections_waba_id_idx').on(table.wabaId),
    index('waba_connections_status_idx').on(table.status),
  ],
);

export const whatsappContacts = sqliteTable(
  'whatsapp_contacts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    installationId: text('installation_id')
      .notNull()
      .references(() => installations.id),
    chatJid: text('chat_jid').notNull(),
    phoneNumber: text('phone_number'),
    displayName: text('display_name'),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('whatsapp_contacts_installation_chat_idx').on(
      table.installationId,
      table.chatJid,
    ),
    index('whatsapp_contacts_installation_phone_idx').on(
      table.installationId,
      table.phoneNumber,
    ),
  ],
);

export const whatsappMessages = sqliteTable(
  'whatsapp_messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    installationId: text('installation_id')
      .notNull()
      .references(() => installations.id),
    whatsappMessageId: text('whatsapp_message_id').notNull(),
    chatJid: text('chat_jid').notNull(),
    participantJid: text('participant_jid'),
    remotePhone: text('remote_phone'),
    normalizedPhone: text('normalized_phone'),
    contactName: text('contact_name'),
    direction: text('direction').notNull(),
    textBody: text('text_body'),
    sentAt: text('sent_at').notNull(),
    replyToWhatsappMessageId: text('reply_to_whatsapp_message_id'),
    hasMedia: integer('has_media', { mode: 'boolean' })
      .notNull()
      .default(false),
    mediaType: text('media_type'),
    mediaMimeType: text('media_mime_type'),
    mediaFileName: text('media_file_name'),
    mediaObjectKey: text('media_object_key'),
    locationLatitude: text('location_latitude'),
    locationLongitude: text('location_longitude'),
    locationName: text('location_name'),
    locationAddress: text('location_address'),
    syncState: text('sync_state').notNull().default('pending'),
    syncAttempts: integer('sync_attempts').notNull().default(0),
    nextRetryAt: text('next_retry_at'),
    lastSyncError: text('last_sync_error'),
    rawMessageJson: text('raw_message_json'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex('whatsapp_messages_installation_message_idx').on(
      table.installationId,
      table.whatsappMessageId,
    ),
    index('whatsapp_messages_installation_sent_at_idx').on(
      table.installationId,
      table.sentAt,
    ),
    index('whatsapp_messages_installation_phone_idx').on(
      table.installationId,
      table.normalizedPhone,
    ),
  ],
);

export const numberFilterEntries = sqliteTable(
  'number_filter_entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    installationId: text('installation_id')
      .notNull()
      .references(() => installations.id),
    phoneNumber: text('phone_number').notNull(),
    normalizedPhone: text('normalized_phone').notNull(),
    reason: text('reason'),
    createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex('number_filter_entries_installation_phone_idx').on(
      table.installationId,
      table.normalizedPhone,
    ),
    index('number_filter_entries_installation_created_idx').on(
      table.installationId,
      table.createdAt,
    ),
  ],
);

export const attioContactNotes = sqliteTable(
  'attio_contact_notes',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    installationId: text('installation_id')
      .notNull()
      .references(() => installations.id),
    conversationKey: text('conversation_key').notNull(),
    attioRecordId: text('attio_record_id').notNull(),
    attioNoteId: text('attio_note_id').notNull(),
    noteTitle: text('note_title').notNull(),
    lastMessageAt: text('last_message_at').notNull(),
    messageCount: integer('message_count').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex('attio_contact_notes_installation_conversation_idx').on(
      table.installationId,
      table.conversationKey,
    ),
    index('attio_contact_notes_installation_updated_idx').on(
      table.installationId,
      table.updatedAt,
    ),
  ],
);

export type Installation = typeof installations.$inferSelect;
export type NewInstallation = typeof installations.$inferInsert;
export type WhatsappSession = typeof whatsappSessions.$inferSelect;
export type NewWhatsappSession = typeof whatsappSessions.$inferInsert;
export type WhatsappSessionCreds = typeof whatsappSessionCreds.$inferSelect;
export type WhatsappSessionKey = typeof whatsappSessionKeys.$inferSelect;
export type WabaConnection = typeof wabaConnections.$inferSelect;
export type NewWabaConnection = typeof wabaConnections.$inferInsert;
export type WhatsappContact = typeof whatsappContacts.$inferSelect;
export type NewWhatsappContact = typeof whatsappContacts.$inferInsert;
export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type NewWhatsappMessage = typeof whatsappMessages.$inferInsert;
export type NumberFilterEntry = typeof numberFilterEntries.$inferSelect;
export type NewNumberFilterEntry = typeof numberFilterEntries.$inferInsert;
export type AttioContactNote = typeof attioContactNotes.$inferSelect;
export type NewAttioContactNote = typeof attioContactNotes.$inferInsert;
