import { findInstallationById } from '@server/db/queries/installations';
import { listNumberFilterEntries } from '@server/db/queries/number-filter-entries';
import {
  findWabaConnectionByPhoneNumberId,
  findWabaConnectionByWabaId,
  upsertWabaConnection,
} from '@server/db/queries/waba-connections';
import { upsertWhatsappContact } from '@server/db/queries/whatsapp-contacts';
import {
  insertWhatsappMessageIfNew,
  upsertWhatsappMessage,
} from '@server/db/queries/whatsapp-messages';
import type { NewWabaConnection } from '@server/db/schema';
import { parseManagedInstallationSettings } from '@server/services/installation-settings-service';
import { z } from 'zod';

const wabaConnectionRegistrationSchema = z.object({
  installationId: z.string().min(1),
  wabaId: z.string().min(1),
  phoneNumberId: z.string().min(1),
  displayPhoneNumber: z.string().min(1).nullable().optional(),
  verifiedName: z.string().min(1).nullable().optional(),
  status: z.string().min(1).optional(),
  connectedAt: z.string().min(1).nullable().optional(),
});

export type WabaConnectionRegistration = z.infer<
  typeof wabaConnectionRegistrationSchema
>;

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{
      field?: string;
      value?: {
        metadata?: {
          phone_number_id?: string;
          display_phone_number?: string;
        };
        contacts?: Array<{
          wa_id?: string;
          profile?: { name?: string };
        }>;
        messages?: MetaMessage[];
        message_echoes?: MetaMessage[];
        statuses?: MetaStatus[];
      };
    }>;
  }>;
};

type MetaMessage = {
  id?: string;
  from?: string;
  to?: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: MetaMedia;
  document?: MetaMedia & { filename?: string };
  video?: MetaMedia;
  audio?: MetaMedia;
  template?: { name?: string; language?: { code?: string } };
  context?: { id?: string };
};

type MetaMedia = {
  id?: string;
  mime_type?: string;
  caption?: string;
};

type MetaStatus = {
  id?: string;
  recipient_id?: string;
  status?: string;
  timestamp?: string;
  errors?: Array<{ title?: string; message?: string; code?: string | number }>;
  conversation?: { origin?: { type?: string } };
  pricing?: { category?: string };
};

type WabaPrivacyContext = {
  metadataOnly: boolean;
  numberFilterMode: 'exclude' | 'include';
  numberFilterPhones: Set<string>;
};

export type WabaIngestResult = {
  processed: number;
  stored: number;
  skipped: number;
  unresolved: Array<{ wabaId: string | null; phoneNumberId: string | null }>;
};

function normalizePhone(phone: string | null | undefined) {
  const normalized = phone?.replace(/\D/g, '') ?? '';
  return normalized || null;
}

function buildOfficialChatJid(phone: string) {
  return `${phone}@s.whatsapp.net`;
}

function parseMetaTimestamp(timestamp: string | undefined) {
  const seconds = Number.parseInt(timestamp ?? '', 10);
  return Number.isFinite(seconds)
    ? new Date(seconds * 1000).toISOString()
    : new Date().toISOString();
}

function extractMedia(message: MetaMessage) {
  if (message.type === 'image' && message.image) {
    return {
      hasMedia: true,
      mediaType: 'image',
      mediaMimeType: message.image.mime_type ?? null,
      mediaFileName: null,
      textBody: message.image.caption ?? null,
    };
  }

  if (message.type === 'document' && message.document) {
    return {
      hasMedia: true,
      mediaType: 'document',
      mediaMimeType: message.document.mime_type ?? null,
      mediaFileName: message.document.filename ?? null,
      textBody: message.document.caption ?? null,
    };
  }

  if (message.type === 'video' && message.video) {
    return {
      hasMedia: true,
      mediaType: 'video',
      mediaMimeType: message.video.mime_type ?? null,
      mediaFileName: null,
      textBody: message.video.caption ?? null,
    };
  }

  if (message.type === 'audio' && message.audio) {
    return {
      hasMedia: true,
      mediaType: 'audio',
      mediaMimeType: message.audio.mime_type ?? null,
      mediaFileName: null,
      textBody: '[Audio]',
    };
  }

  return {
    hasMedia: false,
    mediaType: null,
    mediaMimeType: null,
    mediaFileName: null,
    textBody: null,
  };
}

function extractMessageText(message: MetaMessage) {
  if (message.text?.body) {
    return message.text.body;
  }

  if (message.type === 'template' && message.template?.name) {
    const languageCode = message.template.language?.code;
    return languageCode
      ? `Template: ${message.template.name} (${languageCode})`
      : `Template: ${message.template.name}`;
  }

  return null;
}

function normalizeStatus(status: unknown) {
  const value = typeof status === 'string' ? status.toLowerCase() : '';
  if (
    value === 'sent' ||
    value === 'delivered' ||
    value === 'read' ||
    value === 'failed'
  ) {
    return value;
  }

  return 'delivered';
}

function buildStatusBody(status: MetaStatus) {
  const parts = [`WhatsApp message status: ${status.status ?? 'delivered'}`];
  const originType = status.conversation?.origin?.type;
  const pricingCategory = status.pricing?.category;
  const errorMessage = Array.isArray(status.errors)
    ? status.errors
        .map((error) => error.title || error.message || error.code)
        .filter(Boolean)
        .join(' | ')
    : null;

  if (originType) {
    parts.push(`origin=${originType}`);
  }

  if (pricingCategory) {
    parts.push(`category=${pricingCategory}`);
  }

  if (errorMessage) {
    parts.push(`error=${errorMessage}`);
  }

  return parts.join(' | ');
}

function shouldFilterPhone(
  normalizedPhone: string,
  privacy: WabaPrivacyContext,
) {
  const hasFilterEntry = privacy.numberFilterPhones.has(normalizedPhone);

  if (privacy.numberFilterMode === 'include') {
    return !hasFilterEntry;
  }

  return hasFilterEntry;
}

async function getWabaPrivacyContext(
  installationId: string,
): Promise<WabaPrivacyContext> {
  const [installation, numberFilters] = await Promise.all([
    findInstallationById(installationId),
    listNumberFilterEntries(installationId),
  ]);
  const settings = parseManagedInstallationSettings(
    installation?.settingsJson ?? null,
  );

  return {
    metadataOnly: settings.syncSharingMode === 'metadata_only',
    numberFilterMode: settings.numberFilterMode,
    numberFilterPhones: new Set(
      numberFilters.map((filter) => filter.normalizedPhone),
    ),
  };
}

async function resolveWabaInstallation(input: {
  wabaId: string | null;
  phoneNumberId: string | null;
}) {
  if (input.phoneNumberId) {
    const byPhoneNumberId = await findWabaConnectionByPhoneNumberId(
      input.phoneNumberId,
    );
    if (byPhoneNumberId) {
      return byPhoneNumberId;
    }
  }

  if (input.wabaId) {
    return findWabaConnectionByWabaId(input.wabaId);
  }

  return null;
}

export async function registerWabaConnection(rawInput: unknown) {
  const input = wabaConnectionRegistrationSchema.parse(rawInput);
  const installation = await findInstallationById(input.installationId);

  if (!installation) {
    throw new Error('Installation not found');
  }

  const values: NewWabaConnection = {
    installationId: input.installationId,
    wabaId: input.wabaId,
    phoneNumberId: input.phoneNumberId,
    displayPhoneNumber: input.displayPhoneNumber ?? null,
    verifiedName: input.verifiedName ?? null,
    status: input.status ?? 'connected',
    connectedAt: input.connectedAt ?? new Date().toISOString(),
  };

  return upsertWabaConnection(values);
}

export async function ingestWabaWebhookPayload(
  rawPayload: MetaWebhookPayload,
): Promise<WabaIngestResult> {
  const result: WabaIngestResult = {
    processed: 0,
    stored: 0,
    skipped: 0,
    unresolved: [],
  };

  if (rawPayload.object !== 'whatsapp_business_account') {
    return result;
  }

  for (const entry of rawPayload.entry ?? []) {
    const wabaId = entry.id ?? null;

    for (const change of entry.changes ?? []) {
      if (
        change.field !== 'messages' &&
        change.field !== 'smb_message_echoes'
      ) {
        result.skipped += 1;
        continue;
      }

      const value = change.value ?? {};
      const phoneNumberId = value.metadata?.phone_number_id ?? null;
      const connection = await resolveWabaInstallation({
        wabaId,
        phoneNumberId,
      });

      if (!connection) {
        result.unresolved.push({ wabaId, phoneNumberId });
        result.skipped +=
          (value.messages?.length ?? 0) +
          (value.message_echoes?.length ?? 0) +
          (value.statuses?.length ?? 0);
        continue;
      }

      const privacy = await getWabaPrivacyContext(connection.installationId);

      const contactsByPhone = new Map<string, string>();
      for (const contact of value.contacts ?? []) {
        const phone = normalizePhone(contact.wa_id);
        const name = contact.profile?.name?.trim();
        if (phone && name) {
          contactsByPhone.set(phone, name);
        }
      }

      const messages =
        change.field === 'messages'
          ? (value.messages ?? [])
          : (value.message_echoes ?? []);
      const direction =
        change.field === 'messages'
          ? ('inbound' as const)
          : ('outbound' as const);
      const recipientByMessageId = new Map<string, string>();

      for (const status of value.statuses ?? []) {
        if (status.id && status.recipient_id) {
          recipientByMessageId.set(status.id, status.recipient_id);
        }
      }

      for (const message of messages) {
        result.processed += 1;

        if (!message.id) {
          result.skipped += 1;
          continue;
        }

        const rawContactPhone =
          direction === 'inbound'
            ? message.from
            : message.to || recipientByMessageId.get(message.id);
        const normalizedPhone = normalizePhone(rawContactPhone);

        if (!normalizedPhone) {
          result.skipped += 1;
          continue;
        }

        if (shouldFilterPhone(normalizedPhone, privacy)) {
          result.skipped += 1;
          continue;
        }

        const media = extractMedia(message);
        const textBody = privacy.metadataOnly
          ? null
          : (extractMessageText(message) ?? media.textBody);
        const chatJid = buildOfficialChatJid(normalizedPhone);
        const contactName = contactsByPhone.get(normalizedPhone) ?? null;

        await upsertWhatsappMessage({
          installationId: connection.installationId,
          whatsappMessageId: message.id,
          chatJid,
          participantJid: null,
          remotePhone: rawContactPhone ?? normalizedPhone,
          normalizedPhone,
          contactName,
          direction,
          textBody,
          sentAt: parseMetaTimestamp(message.timestamp),
          replyToWhatsappMessageId: message.context?.id ?? null,
          hasMedia: privacy.metadataOnly ? false : media.hasMedia,
          mediaType: privacy.metadataOnly ? null : media.mediaType,
          mediaMimeType: privacy.metadataOnly ? null : media.mediaMimeType,
          mediaFileName: privacy.metadataOnly ? null : media.mediaFileName,
          rawMessageJson: privacy.metadataOnly
            ? null
            : JSON.stringify({
                source: 'waba',
                wabaId,
                phoneNumberId,
                changeField: change.field,
                message,
              }),
        });

        await upsertWhatsappContact({
          installationId: connection.installationId,
          chatJid,
          phoneNumber: rawContactPhone ?? normalizedPhone,
          displayName: contactName ?? undefined,
        });

        result.stored += 1;
      }

      for (const status of value.statuses ?? []) {
        result.processed += 1;

        if (!status.id || !status.recipient_id) {
          result.skipped += 1;
          continue;
        }

        const normalizedPhone = normalizePhone(status.recipient_id);
        if (!normalizedPhone) {
          result.skipped += 1;
          continue;
        }

        if (shouldFilterPhone(normalizedPhone, privacy)) {
          result.skipped += 1;
          continue;
        }

        const inserted = await insertWhatsappMessageIfNew({
          installationId: connection.installationId,
          whatsappMessageId: status.id,
          chatJid: buildOfficialChatJid(normalizedPhone),
          participantJid: null,
          remotePhone: status.recipient_id,
          normalizedPhone,
          contactName: contactsByPhone.get(normalizedPhone) ?? null,
          direction: 'outbound',
          textBody: privacy.metadataOnly ? null : buildStatusBody(status),
          sentAt: parseMetaTimestamp(status.timestamp),
          replyToWhatsappMessageId: null,
          hasMedia: false,
          mediaType: null,
          mediaMimeType: null,
          mediaFileName: null,
          rawMessageJson: privacy.metadataOnly
            ? null
            : JSON.stringify({
                source: 'waba',
                wabaId,
                phoneNumberId,
                changeField: change.field,
                status: {
                  ...status,
                  normalizedStatus: normalizeStatus(status.status),
                },
              }),
        });

        if (inserted) {
          result.stored += 1;
        }
      }
    }
  }

  return result;
}
