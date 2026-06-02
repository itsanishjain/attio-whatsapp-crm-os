import { Footer, Navbar } from '@/components/landing';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createFileRoute } from '@tanstack/react-router';
import { Check, Clock3, Headphones, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
});

const checkoutUrls = {
  annual: 'https://buy.stripe.com/6oUfZiclHdONbg05AJ7ss0n',
  monthly: 'https://buy.stripe.com/dRmeVe71n8utck4e7f7ss0j',
} as const;

const features = [
  {
    title: 'Real-time Sync',
    body: 'Messages appear in Attio CRM instantly.',
  },
  {
    title: 'Contact Creation',
    body: 'Auto-create people records from WhatsApp.',
  },
  {
    title: 'Contextual Notes',
    body: 'Keep full history as formatted Attio notes.',
  },
  {
    title: 'Blocklist Control',
    body: 'Exclude personal or private numbers.',
  },
  {
    title: 'Team-ready CRM Sync',
    body: 'Keep your Attio workspace updated from WhatsApp activity.',
  },
] as const;

const highlights = [
  {
    icon: Clock3,
    title: 'Quick Setup',
    body: 'Connect WhatsApp and Attio from your dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Sync Controls',
    body: 'Exclude personal or private numbers from your Attio sync.',
  },
  {
    icon: Headphones,
    title: 'Email Support',
    body: 'Contact hello@appstronauts.shop for help with setup or account access.',
  },
] as const;

const faqs = [
  {
    question: 'Can I exclude specific contacts from syncing?',
    answer:
      'Yes. Use number filtering settings to exclude specific phone numbers from your Attio sync.',
  },
  {
    question: 'Can I request new features?',
    answer:
      'Yes. Send your request through the support link and share the workflow you want to improve.',
  },
  {
    question: 'How can I get support?',
    answer:
      'Email hello@appstronauts.shop or use the WhatsApp support link for help with setup and account access.',
  },
] as const;

function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>(
    'annual',
  );
  const isAnnual = billingCycle === 'annual';

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden lines-bg">
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6 md:py-24">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] md:text-6xl">
            Keep WhatsApp and Attio in sync
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
            One plan for teams that want reliable WhatsApp sync into Attio.
          </p>
        </section>

        <div className="mt-10 flex justify-center">
          <div className="flex border border-border bg-card p-1">
            <button
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                isAnnual
                  ? 'bg-green-600 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setBillingCycle('annual')}
              type="button"
            >
              Annual
            </button>
            <button
              className={`px-5 py-2 text-sm font-bold transition-colors ${
                isAnnual
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'bg-green-600 text-white'
              }`}
              onClick={() => setBillingCycle('monthly')}
              type="button"
            >
              Monthly
            </button>
          </div>
        </div>

        <section className="mx-auto mt-14 max-w-xl">
          <Card className="overflow-hidden rounded-none border-green-600 py-0 shadow-xl shadow-green-950/10">
            <div className="border-b border-green-200 bg-green-50 px-6 py-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-green-700">
                Pro Plan
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                Everything you need to sync
              </h2>
            </div>
            <div className="space-y-7 px-6 py-7 md:px-8 md:py-8">
              <div className="text-center">
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-black tracking-[-0.05em]">
                    {isAnnual ? '$10' : '$12'}
                  </span>
                  <span className="pb-1 text-sm font-medium text-muted-foreground">
                    / user / mo
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Billed {isAnnual ? 'yearly' : 'monthly'}
                </p>
              </div>

              <div className="space-y-4 border-y border-border py-6">
                {features.map((feature) => (
                  <div className="flex gap-3" key={feature.title}>
                    <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                      <Check className="size-3.5 stroke-[3]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{feature.title}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {feature.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="h-11 w-full bg-green-600 hover:bg-green-700"
                asChild
              >
                <a href={checkoutUrls[billingCycle]}>Choose Pro</a>
              </Button>
            </div>
          </Card>
        </section>

        <section className="mt-20 grid gap-1 md:grid-cols-3">
          {highlights.map(({ body, icon: Icon, title }) => (
            <Card className="rounded-none p-6 shadow-none" key={title}>
              <Icon className="size-5 text-green-700" />
              <div className="space-y-2">
                <h2 className="text-base font-bold">{title}</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            </Card>
          ))}
        </section>

        <section className="mx-auto mt-20 max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-[-0.02em]">
              Frequently asked questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need to know before connecting your workspace.
            </p>
          </div>
          <div className="mt-8 space-y-1">
            {faqs.map((faq) => (
              <details
                className="group border border-border bg-card p-4 open:bg-muted/30"
                key={faq.question}
              >
                <summary className="cursor-pointer list-none text-sm font-bold">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
