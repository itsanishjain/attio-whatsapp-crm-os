import { Calendar, Headphones, Target, TrendingUp } from 'lucide-react';

export function UseCases() {
  return (
    <div className="flex flex-col items-start gap-10 pb-20 md:pb-32 relative">
      <div className="flex flex-col gap-2 text-left">
        <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl">
          Built for sales and support teams
        </h2>
        <p className="text-base font-normal leading-normal max-w-2xl text-muted-foreground">
          Whether you're closing deals or supporting customers, our WhatsApp
          integration helps you respond faster directly from Attio.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px w-full border border-border bg-border">
        <div className="flex flex-col items-center gap-3 p-4 text-center bg-card">
          <Target className="w-8 h-8 text-primary" />
          <p className="text-base font-medium leading-normal">Lead Nurturing</p>
        </div>
        <div className="flex flex-col items-center gap-3 p-4 text-center bg-card">
          <TrendingUp className="w-8 h-8 text-primary" />
          <p className="text-base font-medium leading-normal">
            Sales Follow-ups
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 p-4 text-center bg-card">
          <Headphones className="w-8 h-8 text-primary" />
          <p className="text-base font-medium leading-normal">
            Customer Support
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 p-4 text-center bg-card">
          <Calendar className="w-8 h-8 text-primary" />
          <p className="text-base font-medium leading-normal">
            Appointment Reminders
          </p>
        </div>
      </div>
    </div>
  );
}
