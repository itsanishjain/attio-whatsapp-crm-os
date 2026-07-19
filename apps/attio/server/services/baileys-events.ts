import { upsertWhatsappContact } from '@server/db/queries/whatsapp-contacts';
import {
  clearWhatsappSessionAuthState,
  deleteWhatsappSessionKeys,
  findWhatsappSessionCredsByInstallationId,
  findWhatsappSessionKeysByIds,
  upsertWhatsappSessionCreds,
  upsertWhatsappSessionKeys,
} from '@server/db/queries/whatsapp-session-auth';
import {
  findWhatsappSessionByInstallationId,
  findWhatsappSessionsWithStoredAuthState,
  upsertWhatsappSession,
} from '@server/db/queries/whatsapp-sessions';
import { env } from '@server/env';
import {
  getMessageRetryPayload,
  ingestWhatsappMessages,
} from '@server/services/baileys-sync';
import {
  createGroupNamesSyncHook,
  createMessagesUpsertHook,
} from '@whatsapp-crm/core/runtime/baileys-runtime-hooks';
import type { BaileysRuntimeConfig } from '@whatsapp-crm/core/runtime/baileys-runtime-types';

import {
  countUploadedWhatsappMediaForInstallation,
  updateWhatsappMessageMedia,
} from '@server/db/queries/whatsapp-messages';
import { APP_SERVICE_NAME } from '@server/lib/app-identity';
import {
  downloadAndUploadWhatsappMedia,
  hasR2Config,
} from '@server/services/media-service';
import { getBaileysSocket } from '@whatsapp-crm/core/runtime/baileys-socket-manager';

const handleMessagesUpsert = createMessagesUpsertHook({
  debugLogPath: null,
  ingestMessages: ingestWhatsappMessages,
  logRawMessages: false,
  hasMediaStorage: hasR2Config,
  mediaUploadConcurrency: env.MEDIA_UPLOAD_CONCURRENCY,
  mediaUploadMaxFilesPerInstallation:
    env.MEDIA_UPLOAD_MAX_FILES_PER_INSTALLATION,
  countUploadedMediaForInstallation: countUploadedWhatsappMediaForInstallation,
  getSocket: getBaileysSocket,
  uploadWhatsappMedia: downloadAndUploadWhatsappMedia,
  updateWhatsappMessageMedia: async (
    installationId,
    whatsappMessageId,
    objectKey,
  ) => {
    await updateWhatsappMessageMedia(
      installationId,
      whatsappMessageId,
      objectKey,
    );
  },
});

const syncGroupNamesToContacts = createGroupNamesSyncHook({
  upsertContact: upsertWhatsappContact,
});

export const appBaileysRuntimeConfig = {
  auth: {
    loadCreds: async (installationId) =>
      (await findWhatsappSessionCredsByInstallationId(installationId))
        ?.credsJson ?? null,
    saveCreds: async (installationId, credsJson) => {
      await upsertWhatsappSessionCreds(installationId, credsJson);
    },
    loadKeys: async (installationId, category, keyIds) => {
      const rows = await findWhatsappSessionKeysByIds(
        installationId,
        category,
        keyIds,
      );
      return rows.map((r) => ({ keyId: r.keyId, valueJson: r.valueJson }));
    },
    saveKeys: async (installationId, category, entries) => {
      await upsertWhatsappSessionKeys(installationId, category, entries);
    },
    deleteKeys: async (installationId, category, keyIds) => {
      await deleteWhatsappSessionKeys(installationId, category, keyIds);
    },
    clearAuthState: async (installationId) => {
      await clearWhatsappSessionAuthState(installationId);
    },
  },
  session: {
    upsertSession: async (input) =>
      upsertWhatsappSession({
        installationId: input.installationId,
        status: input.status,
        recoveryState: input.recoveryState,
        phoneNumber: input.phoneNumber,
        displayName: input.displayName,
        needsRelink: input.needsRelink,
        disconnectCode: input.disconnectCode,
        reconnectAttempts: input.reconnectAttempts,
        lastOpenAt: input.lastOpenAt,
        lastDisconnectAt: input.lastDisconnectAt,
        lastErrorJson: input.lastErrorJson,
        lastSeenAt: input.lastSeenAt ?? new Date().toISOString(),
      }),
    findSession: findWhatsappSessionByInstallationId,
    findRestorableSessions: findWhatsappSessionsWithStoredAuthState,
  },
  contacts: {
    upsertContact: upsertWhatsappContact,
  },
  messages: {
    findMessageByExternalId: getMessageRetryPayload,
  },
  hooks: {
    onMessagesUpsert: async (installationId, messages, type) => {
      try {
        await handleMessagesUpsert(installationId, messages, type);
      } catch (error) {
        console.error('Failed to ingest WhatsApp messages', error);
      }
    },
    onMessagesUpdate: async (installationId, messages) => {
      try {
        await handleMessagesUpsert(installationId, messages, 'messages.update');
      } catch (error) {
        console.error('Failed to ingest recovered WhatsApp messages', error);
      }
    },
    onConnectionOpen: syncGroupNamesToContacts,
  },
  socketOptions: {
    browserName: APP_SERVICE_NAME,
  },
} satisfies BaileysRuntimeConfig;
