import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Copy } from 'lucide-react';

type AccessLinkCardProps = {
  accessLink: string | null;
  copyState: 'idle' | 'copied' | 'error';
  onCopy: () => void;
};

export function AccessLinkCard({
  accessLink,
  copyState,
  onCopy,
}: AccessLinkCardProps) {
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Dashboard Access Link</CardTitle>
        <CardDescription>
          Shortcut to this dashboard from any device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={accessLink || 'Unavailable'}
            className="flex h-9 w-full cursor-not-allowed rounded-md border border-input bg-muted/50 px-3 py-1 font-mono text-sm opacity-70 shadow-sm"
          />
          <Button
            variant="outline"
            size="icon"
            disabled={!accessLink}
            onClick={onCopy}
          >
            {copyState === 'copied' ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
