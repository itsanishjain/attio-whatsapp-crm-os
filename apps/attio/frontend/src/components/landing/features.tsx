import { Card } from '@/components/ui/card';
import { RefreshCw, Users, Zap } from 'lucide-react';

export function Features() {
  return (
    <div className="flex flex-col gap-6 py-20 md:py-32 relative">
      <div className="flex flex-col gap-2 text-left">
        <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl">
          Supercharge Attio with WhatsApp
        </h2>
        <p className="text-base font-normal leading-normal max-w-2xl text-muted-foreground">
          Sync conversations, drive more deals, and manage your WhatsApp
          interactions directly from your Attio CRM workspace.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        <Card className="flex gap-4 p-6 flex-col rounded-none">
          <div className="text-primary bg-primary/10 rounded-none p-3 flex items-center justify-center self-start">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold leading-tight">
              Instant CRM Sync
            </h3>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Automatically log incoming and outgoing WhatsApp messages to Attio
              notes.
            </p>
          </div>
        </Card>
        <Card className="flex gap-4 p-6 flex-col rounded-none">
          <div className="text-primary bg-primary/10 rounded-none p-3 flex items-center justify-center self-start">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 rounded-none">
            <h3 className="text-lg font-bold leading-tight rounded-none">
              Team Collaboration
            </h3>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Let your whole team view and respond to messages from a shared
              number.
            </p>
          </div>
        </Card>
        <Card className="flex gap-4 p-6 flex-col rounded-none">
          <div className="text-primary bg-primary/10 rounded-none p-3 flex items-center justify-center self-start">
            <Zap className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 rounded-none">
            <h3 className="text-lg font-bold leading-tight">
              Automated Workflows
            </h3>
            <p className="text-muted-foreground text-base font-normal leading-normal">
              Trigger automated WhatsApp messages directly from Attio pipeline
              changes.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
