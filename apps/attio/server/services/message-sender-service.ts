import {
  MessageSendError,
  isMessageSendError,
  sendWhatsappMessage as sendWhatsappMessageViaCore,
} from '@server/services/baileys-message-sender';
import {
  getMediaDownloadUrl,
  hasR2Config,
} from '@server/services/media-service';
import type { MediaSource } from '@shared/schemas/send-message';
import type { WASocket } from '@whiskeysockets/baileys';

async function resolveMediaUrl(source: MediaSource) {
  if (source.type !== 'r2_object') {
    throw new MessageSendError(
      500,
      'media_source_not_supported',
      `Media source type ${source.type} is not configured`,
    );
  }

  if (!hasR2Config()) {
    throw new MessageSendError(
      500,
      'r2_not_configured',
      'R2 is not configured — cannot resolve r2_object media source',
    );
  }

  return getMediaDownloadUrl(source.objectKey);
}

export { MessageSendError, isMessageSendError };

export function sendWhatsappMessage(
  socket: WASocket,
  installationId: string,
  rawBody: unknown,
) {
  return sendWhatsappMessageViaCore(socket, installationId, rawBody, {
    resolveMediaUrl,
  });
}
