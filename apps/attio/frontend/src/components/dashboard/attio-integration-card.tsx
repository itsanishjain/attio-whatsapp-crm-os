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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { IntegrationStatusResponse } from '@shared/schemas/integration';
import {
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Loader2,
  XCircle,
} from 'lucide-react';

type AttioIntegrationCardProps = {
  status: IntegrationStatusResponse | null;
  connectError: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  isDisconnecting: boolean;
};

export function AttioIntegrationCard({
  status,
  connectError,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: AttioIntegrationCardProps) {
  return (
    <Card className="flex flex-col shadow-none">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-blue-600" />
          <CardTitle>Attio CRM</CardTitle>
        </div>
        <CardDescription>
          Authorize Attio with OAuth to sync WhatsApp activity to people and
          notes.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between rounded-xl border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${status?.connected ? 'bg-blue-100 text-blue-700' : 'bg-muted-foreground/10 text-muted-foreground'}`}
            >
              {status?.connected ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-xs text-muted-foreground">
                {status?.connected
                  ? status.tenant
                    ? `Connected: ${status.tenant}`
                    : 'Connected'
                  : 'Not connected'}
              </p>
            </div>
          </div>
        </div>

        {!status?.connected && connectError ? (
          <div className="flex flex-col gap-2">
            <p className="flex items-center gap-1 text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              {connectError}
            </p>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="mt-auto flex w-full flex-col gap-3 border-t pt-6">
        {!status?.connected ? (
          <Button
            className="w-full shadow-none"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isConnecting ? 'Redirecting...' : 'Connect Attio'}
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={isDisconnecting}
              >
                {isDisconnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Disconnect Attio
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Attio?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove your Attio CRM integration. WhatsApp activity
                  will no longer sync to Attio.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDisconnect}>
                  Yes, Disconnect
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
