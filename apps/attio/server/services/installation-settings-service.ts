import {
  findInstallationById,
  updateInstallationSettings,
} from '@server/db/queries/installations';
import {
  createNumberFilterEntry as createNumberFilterEntryRecord,
  deleteNumberFilterEntry,
  findNumberFilterEntryByNormalizedPhone,
  listNumberFilterEntries,
} from '@server/db/queries/number-filter-entries';
import {
  type ManagedInstallationSettings,
  managedInstallationSettingsSchema,
} from '@shared/schemas/settings';
import { normalizePhone } from '@whatsapp-crm/core/whatsapp/contact-helpers';
import type { z } from 'zod';

const persistedInstallationSettingsSchema =
  managedInstallationSettingsSchema.catch({
    syncSharingMode: 'full_access',
    timezone: 'UTC',
    numberFilterMode: 'exclude',
    includeAutoSyncFromAttio: false,
    groupSyncEnabled: false,
    groupSyncSelectedGroups: [],
  });

export type PersistedInstallationSettings = z.infer<
  typeof persistedInstallationSettingsSchema
>;

function parseRawInstallationSettings(
  settingsJson: string | null,
): Record<string, unknown> {
  if (!settingsJson) {
    return {};
  }

  try {
    const parsed = JSON.parse(settingsJson) as unknown;

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function parsePersistedInstallationSettings(
  settingsJson: string | null,
): PersistedInstallationSettings {
  return persistedInstallationSettingsSchema.parse(
    parseRawInstallationSettings(settingsJson),
  );
}

export function parseManagedInstallationSettings(
  settingsJson: string | null,
): ManagedInstallationSettings {
  const parsed = parsePersistedInstallationSettings(settingsJson);

  return managedInstallationSettingsSchema.parse({
    syncSharingMode: parsed.syncSharingMode,
    timezone: parsed.timezone,
    numberFilterMode: parsed.numberFilterMode,
    includeAutoSyncFromAttio: parsed.includeAutoSyncFromAttio,
    groupSyncEnabled: parsed.groupSyncEnabled,
    groupSyncSelectedGroups: parsed.groupSyncSelectedGroups,
  });
}

export function buildInstallationSettingsJson(
  existingSettingsJson: string | null,
  update: Partial<PersistedInstallationSettings>,
) {
  const raw = parseRawInstallationSettings(existingSettingsJson);
  const cleanUpdate = Object.fromEntries(
    Object.entries(update).filter(([, value]) => value !== undefined),
  );

  return JSON.stringify({
    ...raw,
    ...cleanUpdate,
  });
}

export async function getInstallationSettings(installationId: string) {
  const installation = await findInstallationById(installationId);

  if (!installation) {
    return managedInstallationSettingsSchema.parse({});
  }

  return parseManagedInstallationSettings(installation.settingsJson);
}

export async function updateManagedInstallationSettings(
  installationId: string,
  update: Partial<ManagedInstallationSettings>,
) {
  const installation = await findInstallationById(installationId);

  if (!installation) {
    throw new Error(`Installation ${installationId} not found`);
  }

  const existing = parseManagedInstallationSettings(installation.settingsJson);
  const merged = managedInstallationSettingsSchema.parse({
    syncSharingMode: update.syncSharingMode ?? existing.syncSharingMode,
    timezone: update.timezone ?? existing.timezone,
    numberFilterMode: update.numberFilterMode ?? existing.numberFilterMode,
    includeAutoSyncFromAttio:
      update.includeAutoSyncFromAttio ?? existing.includeAutoSyncFromAttio,
    groupSyncEnabled: update.groupSyncEnabled ?? existing.groupSyncEnabled,
    groupSyncSelectedGroups:
      update.groupSyncSelectedGroups ?? existing.groupSyncSelectedGroups,
  });

  await updateInstallationSettings(
    installationId,
    buildInstallationSettingsJson(installation.settingsJson, merged),
  );

  return merged;
}

export async function listInstallationNumberFilters(installationId: string) {
  return listNumberFilterEntries(installationId);
}

export async function addInstallationNumberFilterEntry(
  installationId: string,
  input: {
    phoneNumber: string;
    reason?: string | null;
  },
) {
  const normalizedPhone = normalizePhone(input.phoneNumber);

  if (!normalizedPhone) {
    throw new Error('A valid phone number is required');
  }

  const entry = await createNumberFilterEntryRecord({
    installationId,
    phoneNumber: input.phoneNumber,
    normalizedPhone,
    reason: input.reason?.trim() || null,
  });

  return entry;
}

export async function removeInstallationNumberFilterEntry(
  installationId: string,
  id: number,
) {
  return deleteNumberFilterEntry(installationId, id);
}

export async function bulkAddInstallationNumberFilterEntries(
  installationId: string,
  items: Array<{
    phoneNumber: string;
    reason?: string | null;
  }>,
) {
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [index, item] of items.entries()) {
    try {
      const normalizedPhone = normalizePhone(item.phoneNumber);

      if (!normalizedPhone) {
        skipped += 1;
        errors.push(`Row ${index + 1}: invalid phone number`);
        continue;
      }

      const existing = await findNumberFilterEntryByNormalizedPhone(
        installationId,
        normalizedPhone,
      );

      if (existing) {
        skipped += 1;
        continue;
      }

      await createNumberFilterEntryRecord({
        installationId,
        phoneNumber: item.phoneNumber,
        normalizedPhone,
        reason: item.reason?.trim() || null,
      });
      added += 1;
    } catch (error) {
      skipped += 1;
      errors.push(
        `Row ${index + 1}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  return {
    added,
    skipped,
    errors,
  };
}
