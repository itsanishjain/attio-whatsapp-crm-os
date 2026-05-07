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
  onConnect: () => void;
  onConnectOfficial: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
  isConnectingOfficial: boolean;
  isDisconnecting: boolean;
};

const qrSteps = [
  'Open WhatsApp on your phone.',
  'Tap the three dots in the top-right corner, then tap Linked devices.',
  'Tap "Link a Device".',
  'Point your phone at this QR code.',
];

export function WhatsAppSessionCard({
  whatsapp,
  connectError,
  onConnect,
  onConnectOfficial,
  onDisconnect,
  isConnecting,
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

        {!whatsapp?.connected &&
          whatsapp?.status === 'qr_ready' &&
          whatsapp.qrCodeDataUrl ? (
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
                  src={whatsapp.qrCodeDataUrl}
                  alt="QR Code"
                  className="h-52 w-52 rounded-lg object-contain"
                />
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Keep this screen open while you scan.
              </p>
            </div>

            <div className="mt-6 border-t pt-4">
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
        {/* <Button
          className="w-full shadow-none"
          onClick={onConnect}
          disabled={isConnecting || isConnectingOfficial || whatsapp?.connected}
          variant="secondary"
        >
          {isConnecting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isConnecting
            ? 'Starting...'
            : whatsapp?.connected
              ? 'Linked Device Connected'
              : 'Use QR Linked Device'}
        </Button> */}
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
