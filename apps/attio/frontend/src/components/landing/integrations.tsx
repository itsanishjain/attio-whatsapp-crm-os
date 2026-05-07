import {
  Briefcase,
  Globe,
  MessageCircle,
  ShieldCheck,
  Users,
  Webhook,
  Workflow,
  Zap,
} from 'lucide-react';

export function Integrations() {
  return (
    <div className="flex flex-col gap-10 pb-20 md:pb-32 relative section-container">
      <div className="section-header">
        <div className="section-dots">
          <div className="section-dot bg-red-500" />
          <div className="section-dot bg-yellow-500" />
          <div className="section-dot bg-green-500" />
        </div>
        <span className="text-sm font-medium text-neutral-500">Ecosystem</span>
        <div className="w-10" />
      </div>
      <div className="p-8 md:p-12 flex flex-col items-center gap-10">
        <div className="flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl">
            Deeply integrated with Attio
          </h2>
          <p className="text-base font-normal leading-normal max-w-2xl text-muted-foreground">
            Connects WhatsApp directly into your Attio CRM workflow without any
            intermediate steps.
          </p>
        </div>
        <div className="w-full flex justify-center items-center gap-2">
          <div className="flex-1 border-t border-border" />
          <div className="flex justify-center items-center gap-2 md:gap-4 px-4 flex-wrap">
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <MessageCircle className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <Briefcase className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <Zap className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <Webhook className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <Users className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <Workflow className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <Globe className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="flex items-center justify-center p-3 md:p-4 border border-border bg-background rounded-lg text-primary">
              <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
          <div className="flex-1 border-t border-border" />
        </div>
      </div>
    </div>
  );
}
