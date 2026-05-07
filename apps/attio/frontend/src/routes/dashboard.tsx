import {
  AccessLinkCard,
  AttioIntegrationCard,
  DashboardHeader,
  GroupSyncCard,
  NumberFiltersCard,
  SharingModeCard,
  TimezoneCard,
  WhatsAppSessionCard,
} from '@/components/dashboard';
import type { GroupOption, SelectedGroup } from '@/components/dashboard/types';
import {
  type SettingsPayload,
  addNumberFilter,
  bootstrapIntegration,
  bulkImportNumberFilters,
  connectWhatsapp,
  deleteNumberFilter,
  disconnectIntegration,
  disconnectWhatsapp,
  integrationStatusQueryOptions,
  saveGroupSync,
  settingsQueryOptions,
  startAttioOauth,
  startOfficialWhatsappOnboarding,
  updateSettings,
  whatsappGroupsQueryOptions,
  whatsappStatusQueryOptions,
} from '@/lib/api';
import { groupSyncSelectedGroupSchema } from '@shared/schemas/settings';
import type { ManagedInstallationSettings } from '@shared/schemas/settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2, Settings } from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';

function sanitizeSelectedGroups(value: unknown): SelectedGroup[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Map<string, SelectedGroup>();

  for (const group of value) {
    const parsed = groupSyncSelectedGroupSchema.safeParse(group);

    if (!parsed.success || !parsed.data.jid.endsWith('@g.us')) {
      continue;
    }

    deduped.set(parsed.data.jid, parsed.data);
  }

  return Array.from(deduped.values()).sort((left, right) =>
    left.name.localeCompare(right.name),
  );
}

export const Route = createFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();

  const [notice, setNotice] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [whatsappConnectError, setWhatsappConnectError] = useState<
    string | null
  >(null);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );
  const [filterPhoneDraft, setFilterPhoneDraft] = useState('');
  const [filterReasonDraft, setFilterReasonDraft] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [groupSyncEnabledDraft, setGroupSyncEnabledDraft] = useState(false);
  const [selectedGroupsDraft, setSelectedGroupsDraft] = useState<
    SelectedGroup[]
  >([]);
  const [groupSearchDraft, setGroupSearchDraft] = useState('');
  const [groupSyncInitialized, setGroupSyncInitialized] = useState(false);

  const integrationStatus = useQuery(integrationStatusQueryOptions);

  const whatsappStatus = useQuery({
    ...whatsappStatusQueryOptions,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === 'connecting' ||
        status === 'qr_ready' ||
        status === 'reconnecting'
      ) {
        return 2000;
      }
      return false;
    },
  });

  const settingsQuery = useQuery(settingsQueryOptions);

  const groupsQuery = useQuery(whatsappGroupsQueryOptions);

  const status = integrationStatus.data ?? null;
  const whatsapp = whatsappStatus.data ?? null;
  const settings = settingsQuery.data?.settings ?? null;
  const timezoneOptions = settingsQuery.data?.timezoneOptions ?? [];
  const numberFilters = settingsQuery.data?.numberFilters ?? [];
  const accessLink = settingsQuery.data?.accessLink ?? null;

  const availableGroups: GroupOption[] = groupsQuery.data
    ? [...groupsQuery.data.groups].sort((left, right) =>
        left.name.localeCompare(right.name),
      )
    : [];
  const isLoadingGroups = groupsQuery.isPending;
  const groupsError = groupsQuery.error?.message ?? null;

  useEffect(() => {
    if (!settings) {
      return;
    }

    if (!groupSyncInitialized) {
      setGroupSyncInitialized(true);
      setGroupSyncEnabledDraft(settings.groupSyncEnabled);
      setSelectedGroupsDraft(
        sanitizeSelectedGroups(settings.groupSyncSelectedGroups),
      );
    }
  }, [groupSyncInitialized, settings]);

  function applySettingsPayload(data: SettingsPayload) {
    queryClient.setQueryData(settingsQueryOptions.queryKey, data);
    setGroupSyncEnabledDraft(data.settings.groupSyncEnabled);
    setSelectedGroupsDraft(
      sanitizeSelectedGroups(data.settings.groupSyncSelectedGroups),
    );
  }

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const attioStatus = searchParams.get('attio');
    const whatsappConnectionStatus = searchParams.get('whatsapp');

    if (attioStatus === 'connected') {
      setNotice('Attio account connected');
      setConnectError(null);
      void queryClient.invalidateQueries({
        queryKey: integrationStatusQueryOptions.queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: settingsQueryOptions.queryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: whatsappGroupsQueryOptions.queryKey,
      });
    }

    if (attioStatus === 'error') {
      setConnectError('Attio authorization failed');
      setNotice(null);
    }

    if (whatsappConnectionStatus === 'connected') {
      setNotice('WhatsApp account connected');
      setWhatsappConnectError(null);
      void queryClient.invalidateQueries({
        queryKey: whatsappStatusQueryOptions.queryKey,
      });
    }

    if (whatsappConnectionStatus === 'error') {
      setNotice(null);
      setWhatsappConnectError(
        'WhatsApp connected, but bridge registration failed',
      );
    }

    if (!attioStatus && !whatsappConnectionStatus) {
      return;
    }

    searchParams.delete('attio');
    searchParams.delete('whatsapp');
    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, [queryClient]);

  const connectIntegrationMut = useMutation({
    mutationFn: startAttioOauth,
    onSuccess: ({ authorizationUrl }) => {
      window.location.assign(authorizationUrl);
    },
    onError: (error) => {
      setConnectError(error.message);
    },
  });

  const disconnectIntegrationMut = useMutation({
    mutationFn: disconnectIntegration,
    onSuccess: () => {
      queryClient.setQueryData(integrationStatusQueryOptions.queryKey, {
        connected: false,
        tenant: null,
      });
      setNotice('Integration disconnected');
      setConnectError(null);
      queryClient.removeQueries({ queryKey: settingsQueryOptions.queryKey });
    },
    onError: (error) => {
      setConnectError(error.message);
    },
  });

  const connectWhatsappMut = useMutation({
    mutationFn: async () => {
      await bootstrapIntegration();
      return connectWhatsapp();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(whatsappStatusQueryOptions.queryKey, data);
      setNotice('WhatsApp setup started');
      setWhatsappConnectError(null);
    },
    onError: (error) => {
      setWhatsappConnectError(error.message);
    },
  });

  const connectOfficialWhatsappMut = useMutation({
    mutationFn: async () => {
      await bootstrapIntegration();
      return startOfficialWhatsappOnboarding();
    },
    onSuccess: ({ authorizationUrl }) => {
      window.location.assign(authorizationUrl);
    },
    onError: (error) => {
      setWhatsappConnectError(error.message);
    },
  });

  const disconnectWhatsappMut = useMutation({
    mutationFn: disconnectWhatsapp,
    onSuccess: (data) => {
      queryClient.setQueryData(whatsappStatusQueryOptions.queryKey, data);
      setNotice('WhatsApp marked as disconnected');
      setWhatsappConnectError(null);
    },
    onError: (error) => {
      setWhatsappConnectError(error.message);
    },
  });

  const updateSettingsMut = useMutation({
    mutationFn: (update: Partial<ManagedInstallationSettings>) =>
      updateSettings(update),
    onSuccess: (data) => {
      applySettingsPayload(data);
      setNotice('Settings saved');
      setConnectError(null);
    },
    onError: (error) => {
      setConnectError(error.message);
    },
  });

  const addFilterMut = useMutation({
    mutationFn: (data: { phoneNumber: string; reason: string | null }) =>
      addNumberFilter(data),
    onSuccess: () => {
      setFilterPhoneDraft('');
      setFilterReasonDraft('');
      queryClient.invalidateQueries({
        queryKey: settingsQueryOptions.queryKey,
      });
    },
    onError: (error) => {
      setConnectError(error.message);
    },
  });

  const deleteFilterMut = useMutation({
    mutationFn: (id: number) => deleteNumberFilter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: settingsQueryOptions.queryKey,
      });
    },
    onError: (error) => {
      setConnectError(error.message);
    },
  });

  const bulkImportMut = useMutation({
    mutationFn: (
      items: Array<{ phoneNumber: string; reason: string | null }>,
    ) => bulkImportNumberFilters(items),
    onSuccess: (data) => {
      setNotice(`Imported ${data.added} numbers, ${data.skipped} skipped`);
      queryClient.invalidateQueries({
        queryKey: settingsQueryOptions.queryKey,
      });
    },
    onError: (error) => {
      setConnectError(error.message);
    },
    onSettled: () => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
  });

  const saveGroupSyncMut = useMutation({
    mutationFn: (data: {
      groupSyncEnabled: boolean;
      groupSyncSelectedGroups: SelectedGroup[];
    }) => saveGroupSync(data),
    onSuccess: (data) => {
      setGroupSyncEnabledDraft(data.settings.groupSyncEnabled);
      setSelectedGroupsDraft(
        sanitizeSelectedGroups(data.settings.groupSyncSelectedGroups),
      );
      setNotice('Group sync settings saved');
      queryClient.invalidateQueries({
        queryKey: settingsQueryOptions.queryKey,
      });
    },
    onError: (error) => {
      setConnectError(error.message);
    },
  });

  function handleConnect() {
    setConnectError(null);
    setNotice(null);
    connectIntegrationMut.mutate();
  }

  function handleDisconnect() {
    setConnectError(null);
    setNotice(null);
    disconnectIntegrationMut.mutate();
  }

  function handleWhatsappConnect() {
    setWhatsappConnectError(null);
    setNotice(null);
    connectWhatsappMut.mutate();
  }

  function handleOfficialWhatsappConnect() {
    setWhatsappConnectError(null);
    setNotice(null);
    connectOfficialWhatsappMut.mutate();
  }

  function handleWhatsappDisconnect() {
    setWhatsappConnectError(null);
    setNotice(null);
    disconnectWhatsappMut.mutate();
  }

  function handleUpdateSettings(update: Partial<ManagedInstallationSettings>) {
    setConnectError(null);
    updateSettingsMut.mutate(update);
  }

  function handleAddNumberFilter() {
    setConnectError(null);
    addFilterMut.mutate({
      phoneNumber: filterPhoneDraft,
      reason: filterReasonDraft || null,
    });
  }

  function handleDeleteNumberFilter(id: number) {
    setConnectError(null);
    deleteFilterMut.mutate(id);
  }

  function handleGroupToggle(group: SelectedGroup) {
    setSelectedGroupsDraft((current) => {
      const exists = current.some((item) => item.jid === group.jid);

      if (exists) {
        return current.filter((item) => item.jid !== group.jid);
      }

      return sanitizeSelectedGroups([...current, group]);
    });
  }

  function handleRemoveSelectedGroup(jid: string) {
    setSelectedGroupsDraft((current) =>
      current.filter((item) => item.jid !== jid),
    );
  }

  async function handleNumberFilterCsvUpload(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setConnectError(null);

    try {
      const text = await file.text();
      const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        throw new Error('CSV file is empty');
      }

      const headers = lines[0]
        .split(',')
        .map((header) => header.trim().toLowerCase());
      const phoneIndex = headers.findIndex((header) =>
        header.includes('phone'),
      );
      const reasonIndex = headers.findIndex((header) =>
        header.includes('reason'),
      );

      if (phoneIndex === -1) {
        throw new Error("CSV must include a 'Phone Number' column");
      }

      const items = lines
        .slice(1)
        .map((line) => {
          const cells = line.split(',').map((cell) => cell.trim());
          const phoneNumber = cells[phoneIndex];

          if (!phoneNumber) {
            return null;
          }

          return {
            phoneNumber,
            reason: reasonIndex >= 0 ? cells[reasonIndex] || null : null,
          };
        })
        .filter(
          (item): item is { phoneNumber: string; reason: string | null } =>
            item !== null,
        );

      if (items.length === 0) {
        throw new Error('No valid rows found in CSV');
      }

      bulkImportMut.mutate(items);
    } catch (error) {
      setConnectError(
        error instanceof Error ? error.message : 'Failed to import CSV',
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  function downloadNumberFilterSampleCsv() {
    const sample = [
      'Phone Number,Reason',
      settings?.numberFilterMode === 'include'
        ? '919999999999,Priority customer'
        : '919999999999,Personal contact',
      '1234567890,Team member',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download =
      settings?.numberFilterMode === 'include'
        ? 'included_numbers_sample.csv'
        : 'excluded_numbers_sample.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  function handleSaveGroupSync() {
    setConnectError(null);
    saveGroupSyncMut.mutate({
      groupSyncEnabled: groupSyncEnabledDraft,
      groupSyncSelectedGroups: selectedGroupsDraft,
    });
  }

  async function handleCopyAccessLink() {
    if (!accessLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(accessLink);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 2000);
    }
  }

  const isConnecting = connectIntegrationMut.isPending;
  const isDisconnecting = disconnectIntegrationMut.isPending;
  const isWhatsappConnecting = connectWhatsappMut.isPending;
  const isOfficialWhatsappConnecting = connectOfficialWhatsappMut.isPending;
  const isWhatsappDisconnecting = disconnectWhatsappMut.isPending;
  const isUpdatingSettings = updateSettingsMut.isPending;
  const isAddingFilter = addFilterMut.isPending;
  const isBulkImporting = bulkImportMut.isPending;
  const isSavingGroupSync = saveGroupSyncMut.isPending;

  const hasGroupSyncChanges =
    groupSyncEnabledDraft !== (settings?.groupSyncEnabled ?? false) ||
    JSON.stringify(
      selectedGroupsDraft.map((group) => `${group.jid}:${group.name}`).sort(),
    ) !==
      JSON.stringify(
        sanitizeSelectedGroups(settings?.groupSyncSelectedGroups ?? [])
          .map((group) => `${group.jid}:${group.name}`)
          .sort(),
      );

  const visibleGroups = availableGroups.filter(
    (group) =>
      !groupSearchDraft ||
      group.name.toLowerCase().includes(groupSearchDraft.toLowerCase()) ||
      group.jid.toLowerCase().includes(groupSearchDraft.toLowerCase()),
  );

  if (integrationStatus.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background/50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/50 p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <DashboardHeader notice={notice} />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <WhatsAppSessionCard
            whatsapp={whatsapp}
            connectError={whatsappConnectError}
            onConnect={handleWhatsappConnect}
            onConnectOfficial={handleOfficialWhatsappConnect}
            onDisconnect={handleWhatsappDisconnect}
            isConnecting={isWhatsappConnecting}
            isConnectingOfficial={isOfficialWhatsappConnecting}
            isDisconnecting={isWhatsappDisconnecting}
          />
          <AttioIntegrationCard
            status={status}
            connectError={connectError}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            isConnecting={isConnecting}
            isDisconnecting={isDisconnecting}
          />
        </div>

        {settings ? (
          <div className="mt-12 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 border-b pb-2">
              <Settings className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">
                Sync Settings
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <AccessLinkCard
                accessLink={accessLink}
                copyState={copyState}
                onCopy={handleCopyAccessLink}
              />
              <TimezoneCard
                timezone={settings.timezone}
                timezoneOptions={timezoneOptions}
                isUpdating={isUpdatingSettings}
                onTimezoneChange={(value) =>
                  handleUpdateSettings({ timezone: value })
                }
              />
            </div>

            <SharingModeCard
              syncSharingMode={settings.syncSharingMode}
              isUpdating={isUpdatingSettings}
              onSyncSharingModeChange={(mode) =>
                handleUpdateSettings({ syncSharingMode: mode })
              }
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">
              <GroupSyncCard
                groupSyncEnabled={groupSyncEnabledDraft}
                onGroupSyncEnabledChange={setGroupSyncEnabledDraft}
                groupSearch={groupSearchDraft}
                onGroupSearchChange={setGroupSearchDraft}
                isLoadingGroups={isLoadingGroups}
                groupsError={groupsError}
                visibleGroups={visibleGroups}
                selectedGroups={selectedGroupsDraft}
                onToggleGroup={handleGroupToggle}
                onRemoveSelectedGroup={handleRemoveSelectedGroup}
                onSave={handleSaveGroupSync}
                isSaving={isSavingGroupSync}
                hasChanges={hasGroupSyncChanges}
              />
              <NumberFiltersCard
                numberFilterMode={settings.numberFilterMode}
                isUpdatingSettings={isUpdatingSettings}
                onNumberFilterModeChange={(mode) =>
                  handleUpdateSettings({ numberFilterMode: mode })
                }
                filterPhoneDraft={filterPhoneDraft}
                onFilterPhoneDraftChange={setFilterPhoneDraft}
                filterReasonDraft={filterReasonDraft}
                onFilterReasonDraftChange={setFilterReasonDraft}
                onAddNumberFilter={handleAddNumberFilter}
                isAddingFilter={isAddingFilter}
                numberFilters={numberFilters}
                onDeleteNumberFilter={handleDeleteNumberFilter}
                fileInputRef={fileInputRef}
                onCsvUpload={handleNumberFilterCsvUpload}
                onDownloadSample={downloadNumberFilterSampleCsv}
                isBulkImporting={isBulkImporting}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
