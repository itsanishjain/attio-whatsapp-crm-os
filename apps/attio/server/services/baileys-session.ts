import { env } from '@server/env';
import {
  type SendResponse,
  sendResponseSchema,
} from '@shared/schemas/send-message';
import { createBaileysRuntime } from '@whatsapp-crm/core/runtime/baileys-runtime';
import { getBaileysSocket } from '@whatsapp-crm/core/runtime/baileys-socket-manager';
import type { BaileysSessionStatus } from '@whatsapp-crm/core/schemas/baileys';
import {
  baileysSessionStatusSchema,
  whatsappGroupOptionSchema,
} from '@whatsapp-crm/core/schemas/baileys';
import { z } from 'zod';

import { appBaileysRuntimeConfig } from '@server/services/baileys-events';
import {
  MessageSendError,
  sendWhatsappMessage,
} from '@server/services/message-sender-service';

// ── Runtime singleton ────────────────────────────────────────────────────

export const appBaileysRuntime = createBaileysRuntime(appBaileysRuntimeConfig);

const rawWhatsappGroupOptionSchema = whatsappGroupOptionSchema.extend({
  name: z.string().nullish(),
});

function parseWhatsappGroups(payload: unknown) {
  const groups = rawWhatsappGroupOptionSchema.array().parse(payload);

  return whatsappGroupOptionSchema.array().parse(
    groups.map((group) => ({
      ...group,
      name: group.name?.trim() || group.jid,
    })),
  );
}

export async function sendWhatsappMessageViaLocalRuntime(
  installationId: string,
  body: unknown,
): Promise<SendResponse> {
  const socket = getBaileysSocket(installationId);

  if (!socket) {
    throw new MessageSendError(
      409,
      'not_connected',
      'WhatsApp session is not connected',
    );
  }

  return sendWhatsappMessage(socket, installationId, body);
}

export async function getLocalBaileysSessionStatus(
  installationId: string,
): Promise<BaileysSessionStatus | null> {
  return appBaileysRuntime.getSessionStatus(installationId);
}

export async function requestLocalBaileysConnect(
  installationId: string,
): Promise<BaileysSessionStatus> {
  return appBaileysRuntime.startSession(installationId);
}

export async function disconnectLocalBaileysSession(
  installationId: string,
): Promise<BaileysSessionStatus> {
  return appBaileysRuntime.disconnectSession(installationId);
}

export async function listLocalWhatsappGroups(installationId: string) {
  return parseWhatsappGroups(await appBaileysRuntime.listGroups(installationId));
}

// ── Remote service client ────────────────────────────────────────────────

async function callBaileysService(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (env.BAILEYS_SERVICE_TOKEN) {
    headers.set('Authorization', `Bearer ${env.BAILEYS_SERVICE_TOKEN}`);
  }

  return fetch(new URL(path, env.BAILEYS_SERVICE_URL), {
    ...init,
    headers,
  });
}

async function parseBaileysServiceResponse(response: Response) {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Baileys service failed with ${response.status}: ${body}`);
  }

  return baileysSessionStatusSchema.parse(await response.json());
}

function useLocalRuntimeFallback() {
  return env.NODE_ENV === 'test';
}

// ── Public API ───────────────────────────────────────────────────────────

export async function getBaileysSessionStatus(
  installationId: string,
): Promise<BaileysSessionStatus | null> {
  if (useLocalRuntimeFallback()) {
    return getLocalBaileysSessionStatus(installationId);
  }

  const response = await callBaileysService(`/status/${installationId}`);

  if (response.status === 404) {
    return null;
  }

  return parseBaileysServiceResponse(response);
}

export async function requestBaileysConnect(
  installationId: string,
): Promise<BaileysSessionStatus> {
  if (useLocalRuntimeFallback()) {
    return requestLocalBaileysConnect(installationId);
  }

  const response = await callBaileysService(`/connect/${installationId}`, {
    method: 'POST',
  });

  return parseBaileysServiceResponse(response);
}

export async function disconnectBaileysSession(
  installationId: string,
): Promise<BaileysSessionStatus> {
  if (useLocalRuntimeFallback()) {
    return disconnectLocalBaileysSession(installationId);
  }

  const response = await callBaileysService(`/disconnect/${installationId}`, {
    method: 'DELETE',
  });

  return parseBaileysServiceResponse(response);
}

export async function listWhatsappGroups(installationId: string) {
  if (useLocalRuntimeFallback()) {
    return listLocalWhatsappGroups(installationId);
  }

  const response = await callBaileysService(`/groups/${installationId}`);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Baileys service failed with ${response.status}: ${body}`);
  }

  return parseWhatsappGroups(await response.json());
}

export async function sendWhatsappMessageViaService(
  installationId: string,
  body: unknown,
): Promise<SendResponse> {
  if (useLocalRuntimeFallback()) {
    return sendWhatsappMessageViaLocalRuntime(installationId, body);
  }

  const response = await callBaileysService(`/send/${installationId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const error: Error & { status?: number; code?: string } = new Error(
      (errorBody.error as string) ??
        `Baileys service failed with ${response.status}`,
    );
    error.status = response.status;
    error.code = (errorBody.code as string) ?? 'proxy_error';
    throw error;
  }

  return sendResponseSchema.parse(await response.json());
}

export function restoreBaileysSessions() {
  return appBaileysRuntime.restoreSessions();
}
