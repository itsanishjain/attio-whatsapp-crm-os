import { findInstallationById } from '@server/db/queries/installations';
import {
  parseManagedInstallationSettings,
  updateManagedInstallationSettings,
} from '@server/services/installation-settings-service';
import {
  type ManagedInstallationSettings,
  groupSyncSelectedGroupSchema,
} from '@shared/schemas/settings';

export type GroupSyncSettings = Pick<
  ManagedInstallationSettings,
  'groupSyncEnabled' | 'groupSyncSelectedGroups'
>;

export function parseGroupSyncSettings(
  settingsJson: string | null,
): GroupSyncSettings {
  const parsed = parseManagedInstallationSettings(settingsJson);

  return {
    groupSyncEnabled: parsed.groupSyncEnabled,
    groupSyncSelectedGroups: parsed.groupSyncSelectedGroups,
  };
}

export async function getGroupSyncSettings(
  installationId: string,
): Promise<GroupSyncSettings> {
  const installation = await findInstallationById(installationId);
  if (!installation) {
    return { groupSyncEnabled: false, groupSyncSelectedGroups: [] };
  }
  return parseGroupSyncSettings(installation.settingsJson);
}

export async function updateGroupSyncSettings(
  installationId: string,
  update: Partial<GroupSyncSettings>,
): Promise<GroupSyncSettings> {
  if (update.groupSyncSelectedGroups !== undefined) {
    for (const group of update.groupSyncSelectedGroups) {
      groupSyncSelectedGroupSchema.parse(group);
    }
  }

  const merged = await updateManagedInstallationSettings(installationId, {
    groupSyncEnabled: update.groupSyncEnabled,
    groupSyncSelectedGroups: update.groupSyncSelectedGroups,
  });

  return {
    groupSyncEnabled: merged.groupSyncEnabled,
    groupSyncSelectedGroups: merged.groupSyncSelectedGroups,
  };
}

export function shouldSyncGroupMessage(
  settingsJson: string | null,
  chatJid: string,
): boolean {
  if (!chatJid.endsWith('@g.us')) {
    return false;
  }

  const settings = parseGroupSyncSettings(settingsJson);

  if (!settings.groupSyncEnabled) {
    return false;
  }

  if (settings.groupSyncSelectedGroups.length === 0) {
    return true;
  }

  return settings.groupSyncSelectedGroups.some(
    (group) => group.jid === chatJid,
  );
}

export function getConfiguredGroupName(
  settingsJson: string | null,
  chatJid: string,
): string | null {
  if (!chatJid.endsWith('@g.us')) {
    return null;
  }

  const settings = parseGroupSyncSettings(settingsJson);
  const configuredGroup = settings.groupSyncSelectedGroups.find(
    (group) => group.jid === chatJid,
  );

  return configuredGroup?.name ?? null;
}
