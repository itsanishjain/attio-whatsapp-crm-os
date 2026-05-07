import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { SyncSharingMode } from '@shared/schemas/settings';
import { CheckCircle2 } from 'lucide-react';

type SharingModeCardProps = {
  syncSharingMode: SyncSharingMode;
  isUpdating: boolean;
  onSyncSharingModeChange: (mode: SyncSharingMode) => void;
};

type SharingModeOption = {
  value: SyncSharingMode;
  title: string;
  description: string;
};

const sharingModeOptions: SharingModeOption[] = [
  {
    value: 'full_access',
    title: 'Full Access',
    description: 'Syncs complete message content and all metadata into Attio.',
  },
  {
    value: 'metadata_only',
    title: 'Metadata Only',
    description:
      'Hides message bodies. Only syncs contact info and timestamps.',
  },
];

export function SharingModeCard({
  syncSharingMode,
  isUpdating,
  onSyncSharingModeChange,
}: SharingModeCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Default Sharing Mode</CardTitle>
        <CardDescription>
          Control how WhatsApp interactions are synced
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sharingModeOptions.map((option) => {
            const isActive = syncSharingMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (!isUpdating && !isActive) {
                    onSyncSharingModeChange(option.value);
                  }
                }}
                className={`relative rounded-xl border-2 p-4 text-left transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-input bg-background hover:border-primary/50'}`}
              >
                {isActive ? (
                  <div className="absolute right-4 top-4 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : null}
                <h4 className="mb-1 text-sm font-semibold">{option.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
