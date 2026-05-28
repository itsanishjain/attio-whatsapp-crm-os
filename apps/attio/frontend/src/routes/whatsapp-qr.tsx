import {
  AccessLinkCard,
  AttioIntegrationCard,
  GroupSyncCard,
  NumberFiltersCard,
  SharingModeCard,
  TimezoneCard,
} from '@/components/dashboard';
import type { GroupOption, SelectedGroup } from '@/components/dashboard/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  updateSettings,
  whatsappGroupsQueryOptions,
  whatsappStatusQueryOptions,
} from '@/lib/api';
import { groupSyncSelectedGroupSchema } from '@shared/schemas/settings';
import type { ManagedInstallationSettings } from '@shared/schemas/settings';
import type { WhatsappStatusResponse } from '@shared/schemas/whatsapp';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  Settings,
  Smartphone,
  XCircle,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';

export const Route = createFileRoute('/whatsapp-qr')({
  component: WhatsappQrPage,
});

const qrSteps = [
  'Open WhatsApp on your phone.',
  'Tap the three dots in the top-right corner, then tap Linked devices.',
  'Tap "Link a Device".',
  'Point your phone at this QR code.',
];

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

function getStatusLabel(whatsapp: WhatsappStatusResponse | null) {
  if (whatsapp?.connected) {
    return 'Connected';
  }

  return (whatsapp?.status ?? 'Loading').replace(/_/g, ' ');
}

function WhatsappQrPage() {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [attioConnectError, setAttioConnectError] = useState<string | null>(
    null,
  );
  const [qrConnectError, setQrConnectError] = useState<string | null>(null);
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

  const whatsapp = whatsappStatus.data ?? null;
  const attioStatus = integrationStatus.data ?? null;
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
    const attioStatusParam = searchParams.get('attio');
    const whatsappConnectionStatus = searchParams.get('whatsapp');

    if (attioStatusParam === 'connected') {
      setNotice('Attio account connected');
      setAttioConnectError(null);
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

    if (attioStatusParam === 'error') {
      setNotice(null);
      setAttioConnectError('Attio authorization failed');
    }

    if (whatsappConnectionStatus === 'connected') {
      setNotice('WhatsApp account connected');
      setQrConnectError(null);
      void queryClient.invalidateQueries({
        queryKey: whatsappStatusQueryOptions.queryKey,
      });
    }

    if (whatsappConnectionStatus === 'error') {
      setNotice(null);
      setQrConnectError('WhatsApp connected, but bridge registration failed');
    }

    if (!attioStatusParam && !whatsappConnectionStatus) {
      return;
    }

    searchParams.delete('attio');
    searchParams.delete('whatsapp');
    const nextSearch = searchParams.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', nextUrl);
  }, [queryClient]);

  const connectIntegrationMut = useMutation({
    mutationFn: () => startAttioOauth('/whatsapp-qr'),
    onSuccess: ({ authorizationUrl }) => {
      window.location.assign(authorizationUrl);
    },
    onError: (error) => {
      setAttioConnectError(error.message);
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
      setAttioConnectError(null);
      queryClient.removeQueries({ queryKey: settingsQueryOptions.queryKey });
    },
    onError: (error) => {
      setAttioConnectError(error.message);
    },
  });

  const connectWhatsappMut = useMutation({
    mutationFn: async () => {
      await bootstrapIntegration();
      return connectWhatsapp();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(whatsappStatusQueryOptions.queryKey, data);
      setNotice('QR setup started');
      setQrConnectError(null);
    },
    onError: (error) => {
      setNotice(null);
      setQrConnectError(error.message);
    },
  });

  const disconnectWhatsappMut = useMutation({
    mutationFn: disconnectWhatsapp,
    onSuccess: (data) => {
      queryClient.setQueryData(whatsappStatusQueryOptions.queryKey, data);
      setNotice('WhatsApp marked as disconnected');
      setQrConnectError(null);
    },
    onError: (error) => {
      setNotice(null);
      setQrConnectError(error.message);
    },
  });

  const updateSettingsMut = useMutation({
    mutationFn: (update: Partial<ManagedInstallationSettings>) =>
      updateSettings(update),
    onSuccess: (data) => {
      applySettingsPayload(data);
      setNotice('Settings saved');
      setAttioConnectError(null);
    },
    onError: (error) => {
      setAttioConnectError(error.message);
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
      setAttioConnectError(error.message);
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
      setAttioConnectError(error.message);
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
      setAttioConnectError(error.message);
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
      setAttioConnectError(error.message);
    },
  });

  function handleConnect() {
    setAttioConnectError(null);
    setNotice(null);
    connectIntegrationMut.mutate();
  }

  function handleDisconnect() {
    setAttioConnectError(null);
    setNotice(null);
    disconnectIntegrationMut.mutate();
  }

  function handleWhatsappConnect() {
    setQrConnectError(null);
    setNotice(null);
    connectWhatsappMut.mutate();
  }

  function handleWhatsappDisconnect() {
    setQrConnectError(null);
    setNotice(null);
    disconnectWhatsappMut.mutate();
  }

  function handleUpdateSettings(update: Partial<ManagedInstallationSettings>) {
    setAttioConnectError(null);
    updateSettingsMut.mutate(update);
  }

  function handleAddNumberFilter() {
    setAttioConnectError(null);
    addFilterMut.mutate({
      phoneNumber: filterPhoneDraft,
      reason: filterReasonDraft || null,
    });
  }

  function handleDeleteNumberFilter(id: number) {
    setAttioConnectError(null);
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

    setAttioConnectError(null);

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
      setAttioConnectError(
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
    setAttioConnectError(null);
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

  const isAttioConnecting = connectIntegrationMut.isPending;
  const isAttioDisconnecting = disconnectIntegrationMut.isPending;
  const isConnecting = connectWhatsappMut.isPending;
  const isDisconnecting = disconnectWhatsappMut.isPending;
  const isUpdatingSettings = updateSettingsMut.isPending;
  const isAddingFilter = addFilterMut.isPending;
  const isBulkImporting = bulkImportMut.isPending;
  const isSavingGroupSync = saveGroupSyncMut.isPending;
  const showQr =
    !whatsapp?.connected &&
    whatsapp?.status === 'qr_ready' &&
    whatsapp.qrCodeDataUrl;
  const isWaitingForQr =
    !whatsapp?.connected &&
    (whatsapp?.status === 'connecting' || whatsapp?.status === 'reconnecting');

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

  return (
    <div className="min-h-screen bg-background/50 p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="flex flex-col gap-4 border-b pb-6">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit px-0 hover:bg-transparent"
            asChild
          >
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>

          <div className="flex items-center gap-3 text-primary">
            <div className="rounded-xl bg-primary/10 p-2">
              <QrCode className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              QR WhatsApp Connection
            </h1>
          </div>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Connect WhatsApp as a linked device and keep this page open while
            your phone scans the QR code.
          </p>

          {notice ? (
            <div className="mt-2 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4 text-primary animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">{notice}</p>
            </div>
          ) : null}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <Card className="shadow-none">
            <CardHeader>
              <div className="mb-1 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-green-600" />
                <CardTitle>Linked Device Setup</CardTitle>
              </div>
              <CardDescription>
                Generate and scan a WhatsApp QR code
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 rounded-xl border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={
                      whatsapp?.connected
                        ? 'rounded-full bg-green-100 p-2 text-green-700'
                        : 'rounded-full bg-muted-foreground/10 p-2 text-muted-foreground'
                    }
                  >
                    {whatsapp?.connected ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs capitalize text-muted-foreground">
                      {getStatusLabel(whatsapp)}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={whatsapp?.connected ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {getStatusLabel(whatsapp)}
                </Badge>
              </div>

              {whatsappStatus.isError ? (
                <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                  <XCircle className="h-5 w-5 flex-shrink-0" />
                  <p>{whatsappStatus.error.message}</p>
                </div>
              ) : null}

              {showQr ? (
                <div className="rounded-xl border bg-white p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-foreground">
                        Scan with WhatsApp
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Open WhatsApp on your phone and scan this QR code.
                      </p>
                    </div>

                    <div className="mt-5 rounded-2xl border bg-white p-4 shadow-sm">
                      <img
                        src={whatsapp.qrCodeDataUrl ?? ''}
                        alt="WhatsApp QR code"
                        className="h-64 w-64 rounded-lg object-contain"
                      />
                    </div>

                    <p className="mt-3 text-xs text-muted-foreground">
                      This page refreshes the connection status automatically.
                    </p>
                  </div>
                </div>
              ) : null}

              {isWaitingForQr ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border bg-white p-6 text-center">
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-base font-semibold text-foreground">
                    Preparing QR code
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Keep this page open. The QR code will appear here when the
                    WhatsApp session is ready.
                  </p>
                </div>
              ) : null}

              {!showQr && !isWaitingForQr && !whatsapp?.connected ? (
                <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed bg-white p-6 text-center">
                  <QrCode className="mb-4 h-10 w-10 text-muted-foreground" />
                  <p className="text-base font-semibold text-foreground">
                    Start QR setup
                  </p>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Generate a linked-device QR code, then scan it from WhatsApp
                    on your phone.
                  </p>
                </div>
              ) : null}

              {whatsapp?.connected ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">WhatsApp is connected.</p>
                      {whatsapp.phoneNumber || whatsapp.displayName ? (
                        <p className="mt-1 text-green-700">
                          {[whatsapp.displayName, whatsapp.phoneNumber]
                            .filter(Boolean)
                            .join(' - ')}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {whatsapp?.status === 'relink_required' ? (
                <div className="flex gap-2 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>
                    WhatsApp requires relinking.
                    {whatsapp.disconnectCode
                      ? ` (Code: ${whatsapp.disconnectCode})`
                      : ''}{' '}
                    Start setup again to generate a fresh QR code.
                  </p>
                </div>
              ) : null}

              {!whatsapp?.connected && qrConnectError ? (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <XCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{qrConnectError}</span>
                </p>
              ) : null}
            </CardContent>

            <CardFooter className="flex w-full flex-col gap-3 border-t pt-6 sm:flex-row">
              <Button
                className="w-full shadow-none sm:flex-1"
                onClick={handleWhatsappConnect}
                disabled={isConnecting || whatsapp?.connected}
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isConnecting
                  ? 'Starting...'
                  : showQr
                    ? 'Refresh QR Code'
                    : whatsapp?.connected
                      ? 'Linked Device Connected'
                      : 'Generate QR Code'}
              </Button>

              {whatsapp?.status && whatsapp.status !== 'disconnected' ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null}
                      Disconnect
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect WhatsApp?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will end your current WhatsApp session. You'll need
                        to scan a new QR code to reconnect.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleWhatsappDisconnect}
                      >
                        Yes, Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : null}
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <AttioIntegrationCard
              status={attioStatus}
              connectError={attioConnectError}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              isConnecting={isAttioConnecting}
              isDisconnecting={isAttioDisconnecting}
            />

            <Card className="h-fit shadow-none">
              <CardHeader>
                <CardTitle>Scan Steps</CardTitle>
                <CardDescription>
                  Use the linked-device flow in WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {qrSteps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="leading-6 text-muted-foreground">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
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
                includeAutoSyncFromAttio={settings.includeAutoSyncFromAttio}
                isUpdatingSettings={isUpdatingSettings}
                onNumberFilterModeChange={(mode) =>
                  handleUpdateSettings({ numberFilterMode: mode })
                }
                onIncludeAutoSyncFromAttioChange={(enabled) =>
                  handleUpdateSettings({ includeAutoSyncFromAttio: enabled })
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
