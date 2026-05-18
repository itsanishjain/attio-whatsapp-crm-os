import {
  findAttioContactNote,
  upsertAttioContactNote,
} from '@server/db/queries/attio-contact-notes';
import {
  claimAttioNoteMessageSync,
  markAttioNoteMessageSyncFailed,
  markAttioNoteMessageSyncSynced,
} from '@server/db/queries/attio-note-message-syncs';
import { findInstallationById } from '@server/db/queries/installations';
import { findNumberFilterEntryByNormalizedPhone } from '@server/db/queries/number-filter-entries';
import { findConnectedWabaConnectionByInstallationId } from '@server/db/queries/waba-connections';
import {
  type WhatsappMessageRecord,
  listInstallationIdsWithPendingWhatsappMessages,
  listUnsyncedWhatsappMessages,
  markWhatsappMessageFiltered,
  markWhatsappMessagePending,
  markWhatsappMessageSynced,
} from '@server/db/queries/whatsapp-messages';
import { findWhatsappSessionByInstallationId } from '@server/db/queries/whatsapp-sessions';
import { AttioClient } from '@server/services/attio-client';
import { getConfiguredGroupName } from '@server/services/group-service';
import { parseManagedInstallationSettings } from '@server/services/installation-settings-service';
import {
  getIntegrationAccessToken,
  parseIntegrationAuthJson,
} from '@server/services/integration-service';
import {
  getMediaDownloadUrl,
  hasR2Config,
} from '@server/services/media-service';
import { getPhoneFromJid } from '@whatsapp-crm/core/whatsapp/contact-helpers';

export {
  listInstallationIdsWithPendingWhatsappMessages as listInstallationIdsWithPendingAttioMessages,
};

export type AttioSyncResult = {
  ok: true;
  installationId: string;
  processed: number;
  synced: number;
  skipped: number;
  failed: number;
  errors: string[];
};

function getNextRetryAtIso(syncAttempts: number, baseMs = 15_000) {
  const delayMs = Math.min(baseMs * 2 ** Math.min(syncAttempts, 4), 5 * 60_000);
  return new Date(Date.now() + delayMs).toISOString();
}

function isMediaUploadStillPending(message: WhatsappMessageRecord) {
  return message.hasMedia && hasR2Config() && !message.mediaObjectKey;
}

async function shouldFilterMessage(
  installationId: string,
  message: WhatsappMessageRecord,
  settings: ReturnType<typeof parseManagedInstallationSettings>,
) {
  if (message.chatJid.endsWith('@g.us')) {
    return false;
  }

  const normalizedPhone =
    message.normalizedPhone || message.remotePhone?.replace(/\D/g, '') || null;

  if (!normalizedPhone) {
    return false;
  }

  const filterEntry = await findNumberFilterEntryByNormalizedPhone(
    installationId,
    normalizedPhone,
  );

  if (settings.numberFilterMode === 'include') {
    return !filterEntry;
  }

  return Boolean(filterEntry);
}

function getMessageContactPhone(message: WhatsappMessageRecord) {
  return (
    message.normalizedPhone ||
    message.remotePhone ||
    getPhoneFromJid(message.chatJid) ||
    null
  );
}

function getConversationKey(message: WhatsappMessageRecord) {
  if (message.chatJid.endsWith('@g.us')) {
    return message.chatJid;
  }

  return getMessageContactPhone(message) ?? message.chatJid;
}

function getRecordDisplayName(
  installationSettingsJson: string | null,
  message: WhatsappMessageRecord,
) {
  if (message.chatJid.endsWith('@g.us')) {
    return (
      getConfiguredGroupName(installationSettingsJson, message.chatJid) ||
      message.contactName ||
      message.chatJid
    );
  }

  return (
    message.contactName || getMessageContactPhone(message) || message.chatJid
  );
}

function formatDisplayTimestamp(sentAt: string, timezone: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    }).format(new Date(sentAt));
  } catch {
    return sentAt;
  }
}

async function resolveMediaLine(message: WhatsappMessageRecord) {
  if (!message.hasMedia) {
    return null;
  }

  const mediaLabel = message.mediaFileName ?? message.mediaType ?? 'Attachment';

  if (!message.mediaObjectKey || !hasR2Config()) {
    return `${mediaLabel} attached`;
  }

  try {
    return `${mediaLabel}: ${await getMediaDownloadUrl(message.mediaObjectKey)}`;
  } catch {
    return `${mediaLabel} attached`;
  }
}

async function formatNoteEntry(input: {
  message: WhatsappMessageRecord;
  timezone: string;
  metadataOnly: boolean;
}) {
  const sender =
    input.message.direction === 'outbound'
      ? 'You'
      : input.message.contactName ||
        getPhoneFromJid(input.message.participantJid) ||
        input.message.remotePhone ||
        'Unknown sender';
  const direction =
    input.message.direction === 'outbound' ? 'Outbound' : 'Inbound';
  const lines = [
    `[${formatDisplayTimestamp(input.message.sentAt, input.timezone)}] ${direction} - ${sender}`,
  ];

  if (input.metadataOnly) {
    lines.push('Message body hidden by sync settings.');
  } else if (input.message.textBody) {
    lines.push(input.message.textBody);
  } else {
    lines.push('Unsupported WhatsApp payload');
  }

  const mediaLine = await resolveMediaLine(input.message);
  if (mediaLine) {
    lines.push(mediaLine);
  }

  return lines.join('\n');
}

function prependNoteEntry(newEntry: string, existingContent: string | null) {
  const existing = existingContent?.trim();
  return existing ? `${newEntry}\n\n${existing}` : newEntry;
}

function extractNoteContent(
  note: { content_plaintext?: string; content_markdown?: string } | null,
) {
  return note?.content_plaintext || note?.content_markdown || '';
}

function extractAttributeValue(
  values: Record<string, unknown> | undefined,
  slug: string,
) {
  const attributeData = values?.[slug];

  if (!Array.isArray(attributeData) || attributeData.length === 0) {
    return null;
  }

  const [entry] = attributeData as Array<{ value?: unknown }>;
  return entry?.value ?? null;
}

function formatMessageContentForAttribute(message: WhatsappMessageRecord) {
  if (message.textBody) {
    return message.textBody;
  }

  if (message.hasMedia) {
    const mediaLabel = message.mediaType ?? 'Media';
    return message.mediaFileName
      ? `${mediaLabel} - ${message.mediaFileName}`
      : `${mediaLabel} message`;
  }

  if (message.locationLatitude && message.locationLongitude) {
    return message.locationName
      ? `Location - ${message.locationName}`
      : 'Location message';
  }

  return 'Unsupported WhatsApp payload';
}

function formatMessageSnapshot(message: WhatsappMessageRecord) {
  const direction = message.direction === 'outbound' ? 'Outbound' : 'Inbound';
  const content = formatMessageContentForAttribute(message);

  return `[${new Date(message.sentAt).toISOString()}] ${direction}: ${content}`;
}

function buildTrackingAttributeUpdate(input: {
  message: WhatsappMessageRecord;
  currentValues: Record<string, unknown> | undefined;
  metadataOnly: boolean;
  contactPhone: string | null;
  isGroup: boolean;
  agentIdentity: { agentNumber: string | null; agentName: string | null };
}) {
  const {
    message,
    currentValues,
    metadataOnly,
    contactPhone,
    isGroup,
    agentIdentity,
  } = input;
  const direction = message.direction === 'outbound' ? 'Outbound' : 'Inbound';
  const messageDate = new Date(message.sentAt).toISOString().split('T')[0];
  const messageText = formatMessageContentForAttribute(message);
  const currentTotalMessagesRaw = extractAttributeValue(
    currentValues,
    'whatsapp_total_messages',
  );
  const currentTotalMessages =
    typeof currentTotalMessagesRaw === 'number'
      ? currentTotalMessagesRaw
      : Number(currentTotalMessagesRaw) || 0;
  const attributesToUpdate: Record<string, unknown> = {
    whatsapp_total_messages: currentTotalMessages + 1,
    whatsapp_last_message_at: new Date(message.sentAt).toISOString(),
    whatsapp_message_date: messageDate,
    whatsapp_message_direction: direction,
    whatsapp_agent_number: agentIdentity.agentNumber,
    whatsapp_agent_name: agentIdentity.agentName,
  };

  if (!metadataOnly) {
    attributesToUpdate.whatsapp_message_text = formatMessageSnapshot(message);
  }

  if (!isGroup && contactPhone) {
    attributesToUpdate.whatsapp_conversation_link = `https://wa.me/${contactPhone.replace(/\D/g, '')}`;
  }

  if (message.direction === 'outbound') {
    attributesToUpdate.whatsapp_last_outbound_date = messageDate;

    if (!metadataOnly) {
      attributesToUpdate.whatsapp_last_outbound_message = messageText;
    }
  } else {
    attributesToUpdate.whatsapp_last_inbound_date = messageDate;

    if (!metadataOnly) {
      attributesToUpdate.whatsapp_last_inbound_message = messageText;
    }
  }

  if (!extractAttributeValue(currentValues, 'whatsapp_first_contact_date')) {
    attributesToUpdate.whatsapp_first_contact_date = messageDate;
  }

  return Object.fromEntries(
    Object.entries(attributesToUpdate).filter(([, value]) => value !== null),
  );
}

async function resolveAgentIdentity(installationId: string) {
  const [wabaConnection, whatsappSession] = await Promise.all([
    findConnectedWabaConnectionByInstallationId(installationId),
    findWhatsappSessionByInstallationId(installationId),
  ]);

  return {
    agentNumber:
      wabaConnection?.displayPhoneNumber ??
      whatsappSession?.phoneNumber ??
      null,
    agentName:
      wabaConnection?.verifiedName ??
      whatsappSession?.displayName ??
      wabaConnection?.displayPhoneNumber ??
      whatsappSession?.phoneNumber ??
      null,
  };
}

async function syncMessageToAttio(input: {
  client: AttioClient;
  installationId: string;
  installationSettingsJson: string | null;
  settings: ReturnType<typeof parseManagedInstallationSettings>;
  message: WhatsappMessageRecord;
}) {
  const {
    client,
    installationId,
    installationSettingsJson,
    settings,
    message,
  } = input;
  const isGroup = message.chatJid.endsWith('@g.us');
  const conversationKey = getConversationKey(message);
  const displayName = getRecordDisplayName(installationSettingsJson, message);
  const contactPhone = getMessageContactPhone(message);
  const metadataOnly = settings.syncSharingMode === 'metadata_only';

  if (!isGroup && !contactPhone) {
    await markWhatsappMessageFiltered(message.id, 'missing_contact_phone');
    return 'skipped' as const;
  }

  const messageSyncClaim = await claimAttioNoteMessageSync({
    installationId,
    whatsappMessageId: message.whatsappMessageId,
    conversationKey,
  });

  if (messageSyncClaim.status === 'already_synced') {
    await markWhatsappMessageSynced(message.id);
    return 'synced' as const;
  }

  if (messageSyncClaim.status === 'in_progress') {
    await markWhatsappMessagePending(
      message.id,
      'pending',
      'attio_note_message_sync_in_progress',
      getNextRetryAtIso(message.syncAttempts, 5_000),
    );
    return 'skipped' as const;
  }

  try {
    await client.ensureWhatsappAttributes();

    const person = isGroup
      ? await client.findOrCreateGroupPerson(message.chatJid, displayName)
      : ((await client.findPersonByPhone(contactPhone ?? '')) ??
        (await client.createPerson({
          phone: contactPhone ?? conversationKey,
          name: displayName,
        })));
    const recordId = person.id.record_id;
    const attributesToUpdate = buildTrackingAttributeUpdate({
      message,
      currentValues: person.values,
      metadataOnly,
      contactPhone,
      isGroup,
      agentIdentity: await resolveAgentIdentity(installationId),
    });

    if (!extractAttributeValue(person.values, 'whatsapp_phone_number')) {
      attributesToUpdate.whatsapp_phone_number = isGroup
        ? message.chatJid
        : contactPhone
          ? contactPhone.startsWith('+')
            ? contactPhone
            : `+${contactPhone.replace(/\D/g, '')}`
          : conversationKey;
    }

    await client.updatePerson(recordId, attributesToUpdate);

    let syncedAttioNoteId: string | null = null;

    if (!metadataOnly) {
      const existingNote = await findAttioContactNote({
        installationId,
        conversationKey,
      });
      const noteTitle = isGroup
        ? `WhatsApp Group - ${displayName}`
        : `WhatsApp Conversation - ${displayName}`;
      const noteEntry = await formatNoteEntry({
        message,
        timezone: settings.timezone,
        metadataOnly,
      });

      if (existingNote) {
        const attioNote = await client.getNote(existingNote.attioNoteId);
        const replacement = attioNote
          ? await client.replaceNote({
              noteId: existingNote.attioNoteId,
              parentObject: 'people',
              parentRecordId: recordId,
              title: noteTitle,
              content: prependNoteEntry(
                noteEntry,
                extractNoteContent(attioNote),
              ),
            })
          : await client.createNote({
              parentObject: 'people',
              parentRecordId: recordId,
              title: noteTitle,
              content: noteEntry,
            });

        syncedAttioNoteId = replacement.id.note_id;

        await upsertAttioContactNote({
          installationId,
          conversationKey,
          attioRecordId: recordId,
          attioNoteId: syncedAttioNoteId,
          noteTitle,
          lastMessageAt: message.sentAt,
          messageCount: existingNote.messageCount + 1,
        });
      } else {
        const note = await client.createNote({
          parentObject: 'people',
          parentRecordId: recordId,
          title: noteTitle,
          content: noteEntry,
        });

        syncedAttioNoteId = note.id.note_id;

        await upsertAttioContactNote({
          installationId,
          conversationKey,
          attioRecordId: recordId,
          attioNoteId: syncedAttioNoteId,
          noteTitle,
          lastMessageAt: message.sentAt,
          messageCount: 1,
        });
      }
    }

    await markAttioNoteMessageSyncSynced({
      id: messageSyncClaim.sync.id,
      attioNoteId: syncedAttioNoteId,
    });
    await markWhatsappMessageSynced(message.id);
    return 'synced' as const;
  } catch (error) {
    await markAttioNoteMessageSyncFailed({
      id: messageSyncClaim.sync.id,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function syncPendingAttioMessages(
  installationId: string,
  limit = 20,
): Promise<AttioSyncResult> {
  const installation = await findInstallationById(installationId);
  const errors: string[] = [];
  let synced = 0;
  let skipped = 0;
  let failed = 0;

  if (!installation) {
    return {
      ok: true,
      installationId,
      processed: 0,
      synced,
      skipped,
      failed,
      errors: ['installation_not_found'],
    };
  }

  const auth = parseIntegrationAuthJson(installation.authJson);
  const accessToken = getIntegrationAccessToken(auth);
  const messages = await listUnsyncedWhatsappMessages(installationId, limit);

  if (!accessToken) {
    for (const message of messages) {
      await markWhatsappMessagePending(
        message.id,
        'failed',
        'attio_not_connected',
        getNextRetryAtIso(message.syncAttempts),
      );
    }

    return {
      ok: true,
      installationId,
      processed: messages.length,
      synced,
      skipped,
      failed: messages.length,
      errors: messages.length ? ['attio_not_connected'] : [],
    };
  }

  const client = new AttioClient(accessToken);
  const settings = parseManagedInstallationSettings(installation.settingsJson);

  for (const message of messages) {
    try {
      if (isMediaUploadStillPending(message)) {
        await markWhatsappMessagePending(
          message.id,
          'pending',
          'media_upload_pending',
          getNextRetryAtIso(message.syncAttempts, 5_000),
        );
        skipped += 1;
        continue;
      }

      if (await shouldFilterMessage(installationId, message, settings)) {
        await markWhatsappMessageFiltered(message.id, 'number_filtered');
        skipped += 1;
        continue;
      }

      const result = await syncMessageToAttio({
        client,
        installationId,
        installationSettingsJson: installation.settingsJson,
        settings,
        message,
      });

      if (result === 'synced') {
        synced += 1;
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      const messageText =
        error instanceof Error ? error.message : String(error);
      errors.push(messageText);
      await markWhatsappMessagePending(
        message.id,
        'failed',
        messageText,
        getNextRetryAtIso(message.syncAttempts),
      );
    }
  }

  return {
    ok: true,
    installationId,
    processed: messages.length,
    synced,
    skipped,
    failed,
    errors,
  };
}
