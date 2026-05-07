import { findInstallationById } from '@server/db/queries/installations';
import { listNumberFilterEntries } from '@server/db/queries/number-filter-entries';
import {
  findWhatsappContactByChatJid,
  upsertWhatsappContact,
} from '@server/db/queries/whatsapp-contacts';
import {
  findWhatsappMessageByExternalId,
  listRecentWhatsappMessages,
  upsertWhatsappMessage,
} from '@server/db/queries/whatsapp-messages';
import { findWhatsappSessionCredsByInstallationId } from '@server/db/queries/whatsapp-session-auth';
import { findWhatsappSessionByInstallationId } from '@server/db/queries/whatsapp-sessions';
import { env } from '@server/env';
import { parseManagedInstallationSettings } from '@server/services/installation-settings-service';
import { extractStoredBaileysMe } from '@whatsapp-crm/core/runtime/baileys-auth-state';
import type { WhatsappMessageLogEntry } from '@whatsapp-crm/core/schemas/baileys';
import { whatsappMessageSyncStateSchema } from '@whatsapp-crm/core/schemas/baileys';
import { getPhoneFromJid } from '@whatsapp-crm/core/whatsapp/contact-helpers';
import {
  type KnownWhatsappContact,
  extractTextBody,
  getLocalWhatsappIdentity,
  getUnsupportedChatSkipReason,
  hasMediaContent,
  isSelfEchoMessage,
  isSkippableProtocolMessage,
  resolveMessageContactName,
  summarizeMessage,
  unwrapMessageContent,
} from '@whatsapp-crm/core/whatsapp/message-helpers';
import { ingestWhatsappMessageBatch } from '@whatsapp-crm/core/whatsapp/message-ingest';
import { normalizeWhatsappMessage as normalizeWhatsappMessageViaCore } from '@whatsapp-crm/core/whatsapp/message-normalizer';
import type { WAMessage } from '@whiskeysockets/baileys';
import { shouldSyncGroupMessage } from './group-service';

type AppIngestContext = {
  localIdentity: ReturnType<typeof getLocalWhatsappIdentity>;
  settingsJson: string | null;
  settings: ReturnType<typeof parseManagedInstallationSettings>;
  numberFilterPhones: Set<string>;
};

function explainSkippedMessage(
  message: WAMessage,
  knownContact: KnownWhatsappContact,
  localPhone: string | null,
) {
  const remoteJid = message.key.remoteJid;

  if (!message.key.id) {
    return 'missing_message_id';
  }

  if (!remoteJid) {
    return 'missing_remote_jid';
  }

  const unsupportedChatReason = getUnsupportedChatSkipReason(remoteJid);
  if (unsupportedChatReason) {
    return unsupportedChatReason;
  }

  if (isSelfEchoMessage(message, localPhone)) {
    return 'self_echo';
  }

  const content = unwrapMessageContent(message.message ?? null);

  if (isSkippableProtocolMessage(content)) {
    return 'protocol_message';
  }

  const textBody = extractTextBody(content);
  const hasMedia = hasMediaContent(content);

  if (!textBody && !hasMedia) {
    return 'no_supported_text_or_media';
  }

  return {
    reason: 'normalized_null_for_unknown_reason',
    knownContact,
    localPhone,
  };
}

function shouldCaptureMessage(
  message: WAMessage,
  settingsJson: string | null = null,
) {
  const remoteJid = message.key.remoteJid;

  if (!message.key.id || !remoteJid) {
    return false;
  }

  if (getUnsupportedChatSkipReason(remoteJid)) {
    return false;
  }

  if (remoteJid.endsWith('@g.us')) {
    if (env.BYPASS_GROUP_SYNC_SETTINGS) {
      return true;
    }

    return shouldSyncGroupMessage(settingsJson, remoteJid);
  }

  return true;
}

function shouldFilterNormalizedMessage(
  normalizedMessage: NonNullable<
    ReturnType<typeof normalizeWhatsappMessageViaCore>
  >,
  context: AppIngestContext,
) {
  if (normalizedMessage.chatJid.endsWith('@g.us')) {
    return false;
  }

  const normalizedPhone =
    normalizedMessage.normalizedPhone ||
    normalizedMessage.remotePhone?.replace(/\D/g, '') ||
    null;

  if (!normalizedPhone) {
    return false;
  }

  const hasFilterEntry = context.numberFilterPhones.has(normalizedPhone);

  if (context.settings.numberFilterMode === 'include') {
    return !hasFilterEntry;
  }

  return hasFilterEntry;
}

export function normalizeWhatsappMessage(
  installationId: string,
  message: WAMessage,
  knownContact: KnownWhatsappContact = {
    displayName: null,
    phoneNumber: null,
  },
  localPhone: string | null = null,
  settingsJson: string | null = null,
  localParticipantIds?: Set<string>,
) {
  return normalizeWhatsappMessageViaCore({
    installationId,
    message,
    knownContact,
    localPhone,
    localParticipantIds,
    shouldCaptureMessage: (candidate) =>
      shouldCaptureMessage(candidate, settingsJson),
  });
}

export async function ingestWhatsappMessages(
  installationId: string,
  messages: WAMessage[],
) {
  console.log(
    `[baileys-message] Starting ingest for installation ${installationId}: received ${messages.length} message(s)`,
  );

  const result = await ingestWhatsappMessageBatch<AppIngestContext>({
    installationId,
    messages,
    loadContext: async () => {
      const [session, installation, credsRow, numberFilters] =
        await Promise.all([
          findWhatsappSessionByInstallationId(installationId),
          findInstallationById(installationId),
          findWhatsappSessionCredsByInstallationId(installationId),
          listNumberFilterEntries(installationId),
        ]);
      const storedMe = extractStoredBaileysMe(credsRow?.credsJson);
      const localIdentity = getLocalWhatsappIdentity(session, storedMe);
      const settings = parseManagedInstallationSettings(
        installation?.settingsJson ?? null,
      );

      console.log(
        `[baileys-message] Resolved local identity for installation ${installationId}: localPhone=${localIdentity.localPhone ?? 'null'}`,
      );

      return {
        localIdentity,
        settingsJson: installation?.settingsJson ?? null,
        settings,
        numberFilterPhones: new Set(
          numberFilters.map((filter) => filter.normalizedPhone),
        ),
      };
    },
    resolveKnownContact: async (chatJid) => {
      const storedContact = await findWhatsappContactByChatJid(
        installationId,
        chatJid,
      );

      return {
        displayName: storedContact?.displayName ?? null,
        phoneNumber: storedContact?.phoneNumber ?? null,
      } satisfies KnownWhatsappContact;
    },
    normalizeMessage: (message, knownContact, context) => {
      const normalizedMessage = normalizeWhatsappMessage(
        installationId,
        message,
        knownContact,
        context.localIdentity.localPhone,
        context.settingsJson,
        context.localIdentity.participantIds,
      );

      if (
        normalizedMessage &&
        shouldFilterNormalizedMessage(normalizedMessage, context)
      ) {
        return null;
      }

      return normalizedMessage;
    },
    persistMessage: async (normalizedMessage, { context }) => {
      const metadataOnly = context.settings.syncSharingMode === 'metadata_only';

      await upsertWhatsappMessage({
        installationId: normalizedMessage.installationId,
        whatsappMessageId: normalizedMessage.whatsappMessageId,
        chatJid: normalizedMessage.chatJid,
        participantJid: normalizedMessage.participantJid,
        remotePhone: normalizedMessage.remotePhone,
        normalizedPhone: normalizedMessage.normalizedPhone,
        contactName: normalizedMessage.contactName,
        direction: normalizedMessage.direction,
        textBody: metadataOnly ? null : normalizedMessage.textBody,
        sentAt: normalizedMessage.sentAt,
        replyToWhatsappMessageId: normalizedMessage.replyToWhatsappMessageId,
        hasMedia: metadataOnly ? false : normalizedMessage.hasMedia,
        mediaType: metadataOnly ? null : normalizedMessage.mediaType,
        mediaMimeType: metadataOnly ? null : normalizedMessage.mediaMimeType,
        mediaFileName: metadataOnly ? null : normalizedMessage.mediaFileName,
        locationLatitude: metadataOnly
          ? null
          : (normalizedMessage.locationLatitude?.toString() ?? null),
        locationLongitude: metadataOnly
          ? null
          : (normalizedMessage.locationLongitude?.toString() ?? null),
        locationName: metadataOnly ? null : normalizedMessage.locationName,
        locationAddress: metadataOnly
          ? null
          : normalizedMessage.locationAddress,
        rawMessageJson: metadataOnly
          ? null
          : JSON.stringify(normalizedMessage.rawMessage),
      });
    },
    onInspectMessage: ({ message }) => {
      console.log(
        `[baileys-message] Inspecting incoming message for installation ${installationId}`,
        summarizeMessage(message),
      );
    },
    onSkippedMessage: ({ message, knownContact, context }) => {
      console.warn(
        `[baileys-message] Message skipped during normalization for installation ${installationId}`,
      );
      console.dir(
        {
          ...summarizeMessage(message),
          knownContact,
          skipReason: explainSkippedMessage(
            message,
            knownContact,
            context.localIdentity.localPhone,
          ),
        },
        { depth: null, colors: true },
      );
    },
    onStoredMessage: async ({ message, knownContact, normalizedMessage }) => {
      const contactNameHint = resolveMessageContactName(message, knownContact);

      console.log(
        `[baileys-message] Normalized message for installation ${installationId}`,
        {
          whatsappMessageId: normalizedMessage.whatsappMessageId,
          chatJid: normalizedMessage.chatJid,
          direction: normalizedMessage.direction,
          normalizedPhone: normalizedMessage.normalizedPhone,
          participantJid: normalizedMessage.participantJid,
          hasMedia: normalizedMessage.hasMedia,
        },
      );

      console.log(
        `[baileys-message] Stored WhatsApp message for installation ${installationId}`,
        {
          whatsappMessageId: normalizedMessage.whatsappMessageId,
          chatJid: normalizedMessage.chatJid,
        },
      );

      const isGroupChat = normalizedMessage.chatJid.endsWith('@g.us');
      const isLidFallbackPhone =
        normalizedMessage.chatJid.endsWith('@lid') &&
        normalizedMessage.remotePhone ===
          getPhoneFromJid(normalizedMessage.chatJid);

      if (isGroupChat || (isLidFallbackPhone && !contactNameHint)) {
        return;
      }

      await upsertWhatsappContact({
        installationId,
        chatJid: normalizedMessage.chatJid,
        phoneNumber: isLidFallbackPhone
          ? undefined
          : normalizedMessage.remotePhone,
        displayName: contactNameHint ?? undefined,
      });

      return {
        knownContact: {
          displayName: contactNameHint ?? knownContact.displayName,
          phoneNumber: isLidFallbackPhone
            ? knownContact.phoneNumber
            : normalizedMessage.remotePhone,
        },
      };
    },
    timingEnabled: env.BAILEYS_INGEST_TIMING,
  });

  if (result.timingSummary) {
    console.log(
      `[baileys-message] Ingest timing for installation ${installationId}`,
      result.timingSummary,
    );
  }

  return result.normalizedMessages;
}

export async function listWhatsappMessageLog(
  installationId: string,
  limit = 25,
): Promise<WhatsappMessageLogEntry[]> {
  const messages = await listRecentWhatsappMessages(installationId, limit);

  return Promise.all(
    messages.map(async (message) => {
      const storedContact = await findWhatsappContactByChatJid(
        installationId,
        message.chatJid,
      );

      return {
        id: message.id,
        installationId: message.installationId,
        whatsappMessageId: message.whatsappMessageId,
        chatJid: message.chatJid,
        participantJid: message.participantJid,
        remotePhone: storedContact?.phoneNumber ?? message.remotePhone,
        normalizedPhone: message.normalizedPhone,
        contactName: storedContact?.displayName ?? message.contactName,
        direction: message.direction === 'outbound' ? 'outbound' : 'inbound',
        textBody: message.textBody,
        sentAt: message.sentAt,
        replyToWhatsappMessageId: message.replyToWhatsappMessageId,
        hasMedia: message.hasMedia,
        mediaType: message.mediaType,
        mediaMimeType: message.mediaMimeType,
        mediaFileName: message.mediaFileName,
        createdAt: message.createdAt,
        mediaObjectKey: message.mediaObjectKey,
        syncState: whatsappMessageSyncStateSchema.parse(message.syncState),
        conversationState: null,
        primaryExternalId: null,
        pendingReason:
          message.syncState === 'synced' ? null : message.lastSyncError,
      };
    }),
  );
}

export async function getMessageRetryPayload(
  installationId: string,
  messageId: string,
) {
  const message = await findWhatsappMessageByExternalId(
    installationId,
    messageId,
  );

  return message?.rawMessageJson
    ? { rawMessageJson: message.rawMessageJson }
    : null;
}
