import type { LookupAddress } from 'node:dns';
import dns from 'node:dns/promises';
import net from 'node:net';

import {
  type MediaSource,
  type SendMessage,
  type SendResponse,
  sendRequestSchema,
} from '@shared/schemas/send-message';
import { rememberRecentBaileysMessage } from '@whatsapp-crm/core/runtime/baileys-memory-cache';
import type { AnyMessageContent, WASocket } from '@whiskeysockets/baileys';

export class MessageSendError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'MessageSendError';
    this.status = status;
    this.code = code;
  }
}

export function isMessageSendError(error: unknown): error is MessageSendError {
  return error instanceof MessageSendError;
}

function isPrivateIPv4(address: string): boolean {
  const parts = address.split('.').map((part) => Number(part));
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return false;
  }

  const first = parts[0] ?? 0;
  const second = parts[1] ?? 0;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIPv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  if (normalized.startsWith('fe80:')) return true;
  if (normalized.startsWith('::ffff:')) {
    const embedded = normalized.slice('::ffff:'.length);
    return net.isIP(embedded) === 4 && isPrivateIPv4(embedded);
  }
  return false;
}

function isPrivateIp(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) return isPrivateIPv4(address);
  if (family === 6) return isPrivateIPv6(address);
  return false;
}

async function assertSafeMediaUrl(urlValue: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL must be a valid URL',
    );
  }

  if (url.protocol !== 'https:') {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL must use https',
    );
  }
  if (!url.hostname) {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL must include a hostname',
    );
  }
  if (url.username || url.password) {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL cannot include credentials',
    );
  }

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.local')) {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL cannot point to a local host',
    );
  }

  if (net.isIP(hostname) !== 0) {
    if (isPrivateIp(hostname)) {
      throw new MessageSendError(
        400,
        'invalid_media_url',
        'Media URL cannot point to a private IP address',
      );
    }
    return url.toString();
  }

  let addresses: LookupAddress[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL hostname could not be resolved',
    );
  }

  if (!addresses.length) {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL hostname could not be resolved',
    );
  }

  if (addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new MessageSendError(
      400,
      'invalid_media_url',
      'Media URL cannot point to a private or loopback address',
    );
  }

  return url.toString();
}

export type BaileysMessageSenderOptions = {
  resolveMediaUrl?: (source: MediaSource) => Promise<string>;
};

async function resolveMediaUrl(
  source: MediaSource,
  options?: BaileysMessageSenderOptions,
): Promise<string> {
  if (source.type === 'external_url') {
    return assertSafeMediaUrl(source.url);
  }

  if (!options?.resolveMediaUrl) {
    throw new MessageSendError(
      500,
      'media_source_not_supported',
      `Media source type ${source.type} is not configured`,
    );
  }

  return assertSafeMediaUrl(await options.resolveMediaUrl(source));
}

function normalizePhoneDigits(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length < 7 || digits.length > 15) {
    throw new MessageSendError(
      400,
      'invalid_phone_number',
      'Phone number must contain 7 to 15 digits',
    );
  }
  return digits;
}

function buildMentionJids(
  mentions: string[] | undefined,
): string[] | undefined {
  if (!mentions?.length) return undefined;
  return mentions.map((phone) => `${phone}@s.whatsapp.net`);
}

function deriveFileName(urlValue: string, fallback: string): string {
  try {
    const url = new URL(urlValue);
    const lastSegment = url.pathname.split('/').filter(Boolean).pop();
    if (!lastSegment) return fallback;
    const decoded = decodeURIComponent(lastSegment).trim();
    return decoded || fallback;
  } catch {
    return fallback;
  }
}

function escapeVcardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

function buildVcard(
  fullName: string,
  phoneNumber: string,
  organization?: string,
): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVcardValue(fullName)}`,
  ];

  if (organization) {
    lines.push(`ORG:${escapeVcardValue(organization)}`);
  }

  lines.push(
    `TEL;type=CELL;type=VOICE;waid=${phoneNumber}:${phoneNumber}`,
    'END:VCARD',
  );

  return lines.join('\n');
}

async function resolveRecipientJid(
  socket: WASocket,
  phoneNumber: string,
): Promise<string> {
  const digits = normalizePhoneDigits(phoneNumber);
  const lookupJid = `${digits}@s.whatsapp.net`;

  let lookupResult: Awaited<ReturnType<WASocket['onWhatsApp']>> = [];
  try {
    lookupResult = await socket.onWhatsApp(lookupJid);
  } catch (error) {
    console.warn(
      '[message-sender] Recipient lookup failed:',
      error instanceof Error ? error.message : error,
    );
    throw new MessageSendError(
      502,
      'recipient_lookup_failed',
      'Could not verify the recipient on WhatsApp',
    );
  }

  const recipient = (lookupResult ?? []).find((entry) => entry.exists);
  if (!recipient?.jid) {
    throw new MessageSendError(
      404,
      'recipient_not_found',
      'The recipient is not reachable on WhatsApp',
    );
  }

  return recipient.jid;
}

async function buildOutgoingMessage(
  socket: WASocket,
  input: SendMessage,
  options?: BaileysMessageSenderOptions,
) {
  const remoteJid = await resolveRecipientJid(socket, input.phoneNumber);

  switch (input.type) {
    case 'text':
      return {
        remoteJid,
        content: {
          text: input.text,
          mentions: buildMentionJids(input.mentions),
          linkPreview: input.linkPreview,
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    case 'image': {
      const url = await resolveMediaUrl(input.media, options);
      return {
        remoteJid,
        content: {
          image: { url },
          caption: input.caption,
          mentions: buildMentionJids(input.mentions),
          viewOnce: input.viewOnce,
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    }
    case 'video': {
      const url = await resolveMediaUrl(input.media, options);
      return {
        remoteJid,
        content: {
          video: { url },
          caption: input.caption,
          mentions: buildMentionJids(input.mentions),
          viewOnce: input.viewOnce,
          gifPlayback: input.gifPlayback,
          ptv: input.ptv,
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    }
    case 'audio': {
      const url = await resolveMediaUrl(input.media, options);
      return {
        remoteJid,
        content: {
          audio: { url },
          mimetype: input.mimetype,
          ptt: input.ptt,
          seconds: input.seconds,
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    }
    case 'sticker': {
      const url = await resolveMediaUrl(input.media, options);
      return {
        remoteJid,
        content: {
          sticker: { url },
          isAnimated: input.isAnimated,
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    }
    case 'document': {
      const url = await resolveMediaUrl(input.media, options);
      return {
        remoteJid,
        content: {
          document: { url },
          mimetype: input.mimetype,
          fileName: input.fileName ?? deriveFileName(url, 'document'),
          caption: input.caption,
          viewOnce: input.viewOnce,
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    }
    case 'location':
      return {
        remoteJid,
        content: {
          location: {
            degreesLatitude: input.latitude,
            degreesLongitude: input.longitude,
            name: input.name,
            address: input.address,
          },
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    case 'contacts': {
      const displayName =
        input.displayName ?? input.contacts[0]?.fullName ?? 'Contacts';
      return {
        remoteJid,
        content: {
          contacts: {
            displayName,
            contacts: input.contacts.map((contact) => ({
              displayName: contact.fullName,
              vcard: buildVcard(
                contact.fullName,
                normalizePhoneDigits(contact.phoneNumber),
                contact.organization,
              ),
            })),
          },
        },
        options: input.replyToMessageId
          ? { quoted: { key: { id: input.replyToMessageId, remoteJid } } }
          : undefined,
      };
    }
    case 'reaction':
      return {
        remoteJid,
        content: {
          react: {
            text: input.emoji,
            key: {
              id: input.targetWhatsappMessageId,
              remoteJid,
            },
          },
        },
        options: undefined,
      };
  }
}

export async function sendWhatsappMessage(
  socket: WASocket,
  installationId: string,
  rawBody: unknown,
  options?: BaileysMessageSenderOptions,
): Promise<SendResponse> {
  const parsed = sendRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new MessageSendError(
      400,
      'invalid_request',
      parsed.error.issues
        .map((issue) => {
          const path = issue.path.length ? `${issue.path.join('.')}: ` : '';
          return `${path}${issue.message}`;
        })
        .join('; '),
    );
  }

  const outgoing = await buildOutgoingMessage(
    socket,
    parsed.data.message,
    options,
  );

  try {
    const response = await socket.sendMessage(
      outgoing.remoteJid,
      outgoing.content as AnyMessageContent,
      outgoing.options,
    );

    if (!response) {
      throw new MessageSendError(
        502,
        'message_send_failed',
        'WhatsApp did not return a send response',
      );
    }

    if (response.key.id) {
      rememberRecentBaileysMessage(installationId, {
        key: response.key,
        message: response.message,
      });
    }

    return {
      accepted: true,
      messageId: response.key.id ?? null,
      remoteJid: outgoing.remoteJid,
    };
  } catch (error) {
    console.error('[message-sender] sendMessage failed', {
      installationId,
      error: error instanceof Error ? error.message : error,
    });
    throw new MessageSendError(
      502,
      'message_send_failed',
      'Failed to send WhatsApp message',
    );
  }
}
