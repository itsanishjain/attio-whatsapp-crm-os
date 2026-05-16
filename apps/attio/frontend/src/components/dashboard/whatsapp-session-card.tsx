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
import type { WhatsappStatusResponse } from '@shared/schemas/whatsapp';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  XCircle,
} from 'lucide-react';

type WhatsAppSessionCardProps = {
  whatsapp: WhatsappStatusResponse | null;
  connectError: string | null;
  onConnectOfficial: () => void;
  onDisconnect: () => void;
  isConnectingOfficial: boolean;
  isDisconnecting: boolean;
};

export function WhatsAppSessionCard({
  whatsapp,
  connectError,
  onConnectOfficial,
  onDisconnect,
  isConnectingOfficial,
  isDisconnecting,
}: WhatsAppSessionCardProps) {
  return (
    <Card className="flex flex-col shadow-none">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <CardTitle>WhatsApp Session</CardTitle>
        </div>
        <CardDescription>Configure your WhatsApp connection</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between rounded-xl border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-full p-2 ${whatsapp?.connected ? 'bg-green-100 text-green-700' : 'bg-muted-foreground/10 text-muted-foreground'}`}
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
                {whatsapp?.connected
                  ? 'Connected'
                  : (whatsapp?.status || 'Loading...').replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>

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

        {!whatsapp?.connected && connectError ? (
          <p className="flex items-center gap-1 text-sm text-destructive">
            <XCircle className="h-4 w-4 flex-shrink-0" />
            <span>{connectError}</span>
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="mt-auto flex w-full flex-col gap-3 border-t pt-6">
        <Button
          className="w-full shadow-none"
          onClick={onConnectOfficial}
          disabled={isConnectingOfficial || whatsapp?.connected}
        >
          {isConnectingOfficial ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isConnectingOfficial
            ? 'Starting...'
            : whatsapp?.connected
              ? 'Official WhatsApp Connected'
              : 'Connect Official WhatsApp'}
        </Button>
        {whatsapp?.status && whatsapp.status !== 'disconnected' ? (
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
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect WhatsApp?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end your current WhatsApp session. You'll need to
                  scan a new QR code to reconnect.
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
        ) : null}
      </CardFooter>
    </Card>
  );
}
