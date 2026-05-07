import type { AppType } from '@server/app';
import type {
  IntegrationOauthStartResponse,
  IntegrationStatusResponse,
} from '@shared/schemas/integration';
import type {
  ManagedInstallationSettings,
  NumberFilterEntry,
} from '@shared/schemas/settings';
import type {
  WhatsappGroupsResponse,
  WhatsappStatusResponse,
} from '@shared/schemas/whatsapp';
import { queryOptions } from '@tanstack/react-query';
import { hc } from 'hono/client';

export const apiClient = hc<AppType>('/');

// ── Types ────────────────────────────────────────────────────────────────

export type SettingsPayload = {
  settings: ManagedInstallationSettings;
  timezoneOptions: { value: string; label: string }[];
  numberFilters: NumberFilterEntry[];
  accessLink: string | null;
};

// ── Query helpers ────────────────────────────────────────────────────────

async function fetchIntegrationStatus() {
  const res = await apiClient.api.integration.status.$get();
  if (!res.ok) throw new Error('Failed to fetch integration status');
  return (await res.json()) as IntegrationStatusResponse;
}

async function fetchWhatsappStatus() {
  const res = await apiClient.api.whatsapp.status.$get();
  if (!res.ok) throw new Error('Failed to fetch whatsapp status');
  return (await res.json()) as WhatsappStatusResponse;
}

async function fetchSettings() {
  const res = await apiClient.api.settings.$get();
  if (!res.ok) throw new Error('Failed to fetch settings');
  return (await res.json()) as unknown as SettingsPayload;
}

async function fetchWhatsappGroups() {
  const res = await apiClient.api.whatsapp.groups.$get();
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? 'Failed to load groups');
  }
  return (await res.json()) as WhatsappGroupsResponse;
}

// ── Query options ────────────────────────────────────────────────────────

export const integrationStatusQueryOptions = queryOptions({
  queryKey: ['integration-status'],
  queryFn: fetchIntegrationStatus,
  staleTime: 1000 * 60 * 2, // 2 minutes
});

export const whatsappStatusQueryOptions = queryOptions({
  queryKey: ['whatsapp-status'],
  queryFn: fetchWhatsappStatus,
  staleTime: 1000 * 30, // 30 seconds
});

export const settingsQueryOptions = queryOptions({
  queryKey: ['settings'],
  queryFn: fetchSettings,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

export const whatsappGroupsQueryOptions = queryOptions({
  queryKey: ['whatsapp-groups'],
  queryFn: fetchWhatsappGroups,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// ── Mutation helpers (plain async fns used by useMutation) ───────────────

export async function bootstrapIntegration() {
  const res = await apiClient.api.integration.bootstrap.$post();
  if (!res.ok) throw new Error('Failed to bootstrap integration');
  return (await res.json()) as IntegrationStatusResponse;
}

export async function startAttioOauth() {
  const res = await apiClient.api.integration.oauth.start.$get();
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? 'Failed to start Attio OAuth');
  }
  return (await res.json()) as IntegrationOauthStartResponse;
}

export async function disconnectIntegration() {
  const res = await apiClient.api.integration.disconnect.$delete();
  if (!res.ok) throw new Error('Failed to disconnect integration');
  return (await res.json()) as { disconnected: true };
}

export async function connectWhatsapp() {
  const res = await apiClient.api.whatsapp.connect.$post();
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? 'Failed to start WhatsApp setup');
  }
  return (await res.json()) as WhatsappStatusResponse;
}

export async function startOfficialWhatsappOnboarding() {
  const res = await apiClient.api.whatsapp.official.start.$get();
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(
      body.error ?? 'Failed to start official WhatsApp onboarding',
    );
  }
  return (await res.json()) as { ok: true; authorizationUrl: string };
}

export async function disconnectWhatsapp() {
  const res = await apiClient.api.whatsapp.disconnect.$delete();
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? 'Failed to disconnect WhatsApp');
  }
  return (await res.json()) as unknown as WhatsappStatusResponse;
}

export async function updateSettings(
  update: Partial<ManagedInstallationSettings>,
) {
  const res = await apiClient.api.settings.$put({ json: update });
  if (!res.ok) {
    const body = (await res.json()) as unknown as { error: string };
    throw new Error(body.error ?? 'Failed to update settings');
  }
  return (await res.json()) as unknown as SettingsPayload;
}

export async function addNumberFilter(data: {
  phoneNumber: string;
  reason: string | null;
}) {
  const res = await apiClient.api.settings['number-filters'].$post({
    json: data,
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? 'Failed to add number');
  }
  return res.json();
}

export async function deleteNumberFilter(id: number) {
  const res = await apiClient.api.settings['number-filters'][':id'].$delete({
    param: { id: String(id) },
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? 'Failed to remove number');
  }
  return res.json();
}

export async function bulkImportNumberFilters(
  items: Array<{ phoneNumber: string; reason: string | null }>,
) {
  const res = await apiClient.api.settings['number-filters'].bulk.$post({
    json: { items },
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? 'Failed to import CSV');
  }
  return (await res.json()) as { added: number; skipped: number };
}

export async function saveGroupSync(data: {
  groupSyncEnabled: boolean;
  groupSyncSelectedGroups: Array<{ jid: string; name: string }>;
}) {
  const res = await apiClient.api.settings['group-sync'].$put({ json: data });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? 'Failed to save group sync settings');
  }
  return (await res.json()) as {
    settings: {
      groupSyncEnabled: boolean;
      groupSyncSelectedGroups: Array<{ jid: string; name: string }>;
    };
  };
}
