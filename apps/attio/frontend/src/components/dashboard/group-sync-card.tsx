import type { GroupOption, SelectedGroup } from '@/components/dashboard/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2, Loader2, Search, Users, XCircle } from 'lucide-react';

type GroupSyncCardProps = {
  groupSyncEnabled: boolean;
  onGroupSyncEnabledChange: (enabled: boolean) => void;
  groupSearch: string;
  onGroupSearchChange: (query: string) => void;
  isLoadingGroups: boolean;
  groupsError: string | null;
  visibleGroups: GroupOption[];
  selectedGroups: SelectedGroup[];
  onToggleGroup: (group: SelectedGroup) => void;
  onRemoveSelectedGroup: (jid: string) => void;
  onSave: () => void;
  isSaving: boolean;
  hasChanges: boolean;
};

export function GroupSyncCard({
  groupSyncEnabled,
  onGroupSyncEnabledChange,
  groupSearch,
  onGroupSearchChange,
  isLoadingGroups,
  groupsError,
  visibleGroups,
  selectedGroups,
  onToggleGroup,
  onRemoveSelectedGroup,
  onSave,
  isSaving,
  hasChanges,
}: GroupSyncCardProps) {
  return (
    <Card className="flex flex-col shadow-none">
      <CardHeader>
        <div className="mb-1 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Group Sync
          </CardTitle>
          <label className="flex cursor-pointer items-center">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={groupSyncEnabled}
                onChange={() => onGroupSyncEnabledChange(!groupSyncEnabled)}
                disabled={isSaving}
              />
              <div
                className={`block h-6 w-10 rounded-full transition-colors ${groupSyncEnabled ? 'bg-primary' : 'bg-input'}`}
              />
              <div
                className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${groupSyncEnabled ? 'translate-x-4 transform' : ''}`}
              />
            </div>
          </label>
        </div>
        <CardDescription>
          Enable syncing specifically for selected WhatsApp groups
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search available groups..."
            className="flex h-9 w-full rounded-md border border-input bg-background py-1 pl-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={groupSearch}
            onChange={(event) => onGroupSearchChange(event.target.value)}
          />
        </div>

        <div className="min-h-[250px] flex-1 overflow-y-auto rounded-md border bg-muted/20 max-h-[300px]">
          <div className="space-y-1 p-2">
            {isLoadingGroups ? (
              <p className="flex items-center justify-center gap-2 p-4 text-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading groups...
              </p>
            ) : groupsError ? (
              <p className="p-4 text-center text-sm text-destructive">
                {groupsError}
              </p>
            ) : visibleGroups.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                No groups found or available.
              </p>
            ) : (
              visibleGroups.map((group) => {
                const isSelected = selectedGroups.some(
                  (item) => item.jid === group.jid,
                );

                return (
                  <button
                    key={group.jid}
                    type="button"
                    onClick={() =>
                      onToggleGroup({ jid: group.jid, name: group.name })
                    }
                    className={`flex w-full items-center justify-between rounded-md p-3 text-left transition-colors ${isSelected ? 'border border-primary/20 bg-primary/10' : 'border border-transparent hover:bg-muted/50'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium">
                        {group.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {group.participantCount} participants
                      </p>
                    </div>
                    {isSelected ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                    ) : (
                      <div className="h-5 w-5 flex-shrink-0 rounded-full border text-transparent" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
            Selected ({selectedGroups.length})
          </h4>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {selectedGroups.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No groups selected.
              </p>
            ) : null}
            {selectedGroups.map((group) => (
              <div
                key={group.jid}
                className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
              >
                <span className="max-w-[120px] truncate">{group.name}</span>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => onRemoveSelectedGroup(group.jid)}
                >
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="mt-auto border-t pt-4">
        <Button
          className="w-full shadow-none"
          onClick={onSave}
          disabled={
            isSaving ||
            !hasChanges ||
            (groupSyncEnabled && selectedGroups.length === 0)
          }
        >
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Group Settings
        </Button>
      </CardFooter>
    </Card>
  );
}
