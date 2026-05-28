import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  NumberFilterEntry,
  NumberFilterMode,
} from '@shared/schemas/settings';
import { Download, Loader2, Plus, Search, Trash2, Upload } from 'lucide-react';
import type { ChangeEvent, RefObject } from 'react';

type NumberFiltersCardProps = {
  numberFilterMode: NumberFilterMode;
  includeAutoSyncFromAttio: boolean;
  isUpdatingSettings: boolean;
  onNumberFilterModeChange: (mode: NumberFilterMode) => void;
  onIncludeAutoSyncFromAttioChange: (enabled: boolean) => void;
  filterPhoneDraft: string;
  onFilterPhoneDraftChange: (value: string) => void;
  filterReasonDraft: string;
  onFilterReasonDraftChange: (value: string) => void;
  onAddNumberFilter: () => void;
  isAddingFilter: boolean;
  numberFilters: NumberFilterEntry[];
  onDeleteNumberFilter: (id: number) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onCsvUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onDownloadSample: () => void;
  isBulkImporting: boolean;
};

export function NumberFiltersCard({
  numberFilterMode,
  includeAutoSyncFromAttio,
  isUpdatingSettings,
  onNumberFilterModeChange,
  onIncludeAutoSyncFromAttioChange,
  filterPhoneDraft,
  onFilterPhoneDraftChange,
  filterReasonDraft,
  onFilterReasonDraftChange,
  onAddNumberFilter,
  isAddingFilter,
  numberFilters,
  onDeleteNumberFilter,
  fileInputRef,
  onCsvUpload,
  onDownloadSample,
  isBulkImporting,
}: NumberFiltersCardProps) {
  return (
    <Card className="flex flex-col shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5" />
          Number Filters
        </CardTitle>
        <CardDescription>
          Include or exclude specific numbers from syncing
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${numberFilterMode === 'exclude' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => onNumberFilterModeChange('exclude')}
            disabled={isUpdatingSettings}
          >
            Exclude List
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-all ${numberFilterMode === 'include' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => onNumberFilterModeChange('include')}
            disabled={isUpdatingSettings}
          >
            Include Only
          </button>
        </div>

        {numberFilterMode === 'include' ? (
          <div className="rounded-md border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Auto-include Attio people</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  If an unlisted number already exists in Attio, add it to the
                  include list and sync it.
                </p>
              </div>
              <label className="flex shrink-0 cursor-pointer items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={includeAutoSyncFromAttio}
                    onChange={() =>
                      onIncludeAutoSyncFromAttioChange(
                        !includeAutoSyncFromAttio,
                      )
                    }
                    disabled={isUpdatingSettings}
                  />
                  <div
                    className={`block h-6 w-10 rounded-full transition-colors ${includeAutoSyncFromAttio ? 'bg-primary' : 'bg-input'}`}
                  />
                  <div
                    className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${includeAutoSyncFromAttio ? 'translate-x-4 transform' : ''}`}
                  />
                </div>
              </label>
            </div>
            {isUpdatingSettings ? (
              <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving preference...
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 919999999999"
            className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filterPhoneDraft}
            onChange={(event) => onFilterPhoneDraftChange(event.target.value)}
          />
          <input
            type="text"
            placeholder="Reason (Op)"
            className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={filterReasonDraft}
            onChange={(event) => onFilterReasonDraftChange(event.target.value)}
          />
          <Button
            size="icon"
            onClick={onAddNumberFilter}
            disabled={isAddingFilter || !filterPhoneDraft}
            className="h-9 w-9 flex-shrink-0"
          >
            {isAddingFilter ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="min-h-[150px] max-h-[250px] flex-1 overflow-y-auto rounded-md border">
          {numberFilters.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <Search className="mb-2 h-8 w-8 opacity-20" />
              <p className="text-sm">No filters added.</p>
            </div>
          ) : (
            <div className="divide-y">
              {numberFilters.map((entry) => (
                <div
                  key={entry.id}
                  className="flex flex-col justify-between p-3 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center"
                >
                  <div className="mb-2 sm:mb-0">
                    <p className="text-sm font-medium">{entry.phoneNumber}</p>
                    {entry.reason ? (
                      <p className="text-xs text-muted-foreground">
                        {entry.reason}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="-mr-1 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDeleteNumberFilter(entry.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex flex-col gap-3 border-t pt-4 sm:flex-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onCsvUpload}
        />
        <Button
          variant="outline"
          className="w-full shadow-none sm:flex-1"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBulkImporting}
        >
          {isBulkImporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Import CSV
        </Button>
        <Button
          variant="outline"
          className="w-full shadow-none sm:flex-1"
          onClick={onDownloadSample}
        >
          <Download className="mr-2 h-4 w-4" />
          Sample
        </Button>
      </CardFooter>
    </Card>
  );
}
