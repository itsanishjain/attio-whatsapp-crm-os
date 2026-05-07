import { CheckCircle2, Smartphone } from 'lucide-react';

type DashboardHeaderProps = {
  notice: string | null;
};

export function DashboardHeader({ notice }: DashboardHeaderProps) {
  return (
    <section className="flex flex-col gap-2 border-b pb-6">
      <div className="flex items-center gap-3 text-primary">
        <div className="rounded-xl bg-primary/10 p-2">
          <Smartphone className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Attio Integration</h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Manage your WhatsApp connection and sync settings for Attio CRM.
      </p>
      {notice ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4 text-primary animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{notice}</p>
        </div>
      ) : null}
    </section>
  );
}
