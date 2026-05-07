import { Card, CardContent } from '@/components/ui/card';

export function DashboardPreview() {
  return (
    <div className="w-full grow bg-card p-1 border border-border relative shadow-lg shadow-primary/10">
      <div className="flex flex-col p-6 md:p-8 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-4 p-4 border border-border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Recent Leads
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-muted-foreground pt-px">
                  01
                </span>
                <p className="text-sm font-medium">
                  Acme Corp - Demo Scheduled
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-muted-foreground pt-px">
                  02
                </span>
                <p className="text-sm font-medium">
                  TechFlow - Contract Review
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xs font-mono text-muted-foreground pt-px">
                  03
                </span>
                <p className="text-sm font-medium">
                  GlobalPress - Initial Outreach
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-4 border border-border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Message Engagement
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-full bg-border h-3">
                  <div className="h-3 bg-primary" style={{ width: '85%' }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Delivered
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-full bg-border h-3">
                  <div className="h-3 bg-primary" style={{ width: '72%' }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Read
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-full bg-border h-3">
                  <div className="h-3 bg-primary" style={{ width: '60%' }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  Replied
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4 p-4 border border-border">
            <h3 className="text-sm font-medium text-muted-foreground">
              Connection Health
            </h3>
            <div className="flex items-center justify-center h-full">
              <div className="relative w-24 h-24">
                <svg
                  aria-hidden="true"
                  className="w-full h-full"
                  viewBox="0 0 36 36"
                >
                  <path
                    className="stroke-border"
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeWidth="2"
                  />
                  <path
                    className="stroke-primary"
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    strokeDasharray="99, 100"
                    strokeLinecap="round"
                    strokeWidth="2"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold">99%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-4 border border-border">
          <h3 className="text-sm font-medium text-muted-foreground">
            Messages Over Time
          </h3>
          <div className="w-full h-32">
            <svg
              aria-hidden="true"
              className="w-full h-full"
              preserveAspectRatio="none"
              viewBox="0 0 200 80"
            >
              <path
                className="text-primary/10"
                d="M0 80 L0 70 L25 50 L50 60 L75 40 L100 50 L125 30 L150 45 L175 25 L200 40 L200 80 Z"
                fill="currentColor"
              />
              <path
                className="text-primary"
                d="M0 70 L25 50 L50 60 L75 40 L100 50 L125 30 L150 45 L175 25 L200 40"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
              <line
                className="stroke-border"
                strokeWidth="1"
                x1="0"
                x2="200"
                y1="80"
                y2="80"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
