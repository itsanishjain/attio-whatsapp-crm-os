import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Footer, Navbar } from '@/components/landing';
import { Link, createFileRoute } from '@tanstack/react-router';
import {
  ArrowRightLeft,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Filter,
  Link2,
  MessageSquare,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/docs')({
  component: DocsPage,
});

type Feature = {
  body: string;
  bullets?: readonly string[];
  callout?: string;
  icon: typeof MessageSquare;
  image?: string;
  title: string;
};

type AttioField = {
  slug: string;
  title: string;
  type: string;
  useCase: string;
};

const attioFields = [
  {
    title: 'WhatsApp Phone Number (Raw)',
    slug: 'whatsapp_phone_number',
    type: 'Text',
    useCase: 'Raw WhatsApp identifier used as a reliable fallback key',
  },
  {
    title: 'Last Inbound WhatsApp Message',
    slug: 'whatsapp_last_inbound_message',
    type: 'Text',
    useCase: 'Most recent message received from the contact',
  },
  {
    title: 'Last Outbound WhatsApp Message',
    slug: 'whatsapp_last_outbound_message',
    type: 'Text',
    useCase: 'Most recent message you sent to the contact',
  },
  {
    title: 'Last Contact By Client',
    slug: 'whatsapp_last_inbound_date',
    type: 'Date',
    useCase: 'Date when the contact last messaged you',
  },
  {
    title: 'Last Contacted Client',
    slug: 'whatsapp_last_outbound_date',
    type: 'Date',
    useCase: 'Date when you last messaged the contact',
  },
  {
    title: 'WhatsApp Conversation Started',
    slug: 'whatsapp_first_contact_date',
    type: 'Date',
    useCase: 'First known WhatsApp interaction date',
  },
  {
    title: 'WhatsApp Conversation',
    slug: 'whatsapp_conversation_link',
    type: 'Text',
    useCase: 'Direct wa.me link to continue the chat',
  },
  {
    title: 'WhatsApp Message Text',
    slug: 'whatsapp_message_text',
    type: 'Text',
    useCase: 'Formatted snapshot of the latest tracked WhatsApp message',
  },
  {
    title: 'WhatsApp Message Date',
    slug: 'whatsapp_message_date',
    type: 'Date',
    useCase: 'Date of the latest tracked WhatsApp message for filtering',
  },
  {
    title: 'WhatsApp Message Direction',
    slug: 'whatsapp_message_direction',
    type: 'Select',
    useCase: 'Inbound or outbound direction of the latest tracked message',
  },
  {
    title: 'Total WhatsApp Messages',
    slug: 'whatsapp_total_messages',
    type: 'Number',
    useCase: 'Running total of inbound and outbound WhatsApp messages',
  },
  {
    title: 'WhatsApp Agent Number',
    slug: 'whatsapp_agent_number',
    type: 'Text',
    useCase: 'Latest sending agent or business number used for sync',
  },
  {
    title: 'WhatsApp Agent Name',
    slug: 'whatsapp_agent_name',
    type: 'Text',
    useCase: 'Latest sending agent display name used for sync',
  },
  {
    title: 'Last WhatsApp Message At',
    slug: 'whatsapp_last_message_at',
    type: 'Timestamp',
    useCase: 'Sortable exact datetime of latest WhatsApp activity',
  },
] as const satisfies readonly AttioField[];

const features = [
  {
    icon: MessageSquare,
    title: 'One-on-One Chat Sync',
    body: 'Every direct WhatsApp message is synced to Attio in near real time. Inbound and outbound messages are logged as notes on the matching Person record with sender, timestamp, and direction context.',
    bullets: [
      'Inbound and outbound messages captured',
      'Logged as formatted Attio notes',
      'Contact auto-created if not found',
      'Includes sender name and timestamp',
    ],
  },
  {
    icon: Users,
    title: 'Group Chat Sync',
    body: 'Linked WhatsApp accounts can sync selected groups. Each selected group gets its own dedicated Person record in Attio, and group messages are logged with sender information attached.',
    callout: 'Not available on WhatsApp Business API',
    bullets: [
      'Available on Linked WhatsApp only',
      'Each group gets its own Person record',
      'Sender info included in every note',
      'Toggle group sync on or off anytime',
    ],
  },
  {
    icon: Filter,
    title: 'Include / Exclude Mode',
    body: 'Control which phone numbers sync. Exclude Mode syncs every number except those blocked. Include Mode syncs only numbers you explicitly add.',
    bullets: [
      'Add numbers manually one by one',
      'Bulk upload via CSV file',
      'Download a sample CSV template',
      'Optional reason or label for each number',
    ],
  },
  {
    icon: UserPlus,
    title: 'Auto-Include from Attio',
    body: 'When Include Mode is active, existing Attio contacts can be automatically added to your include list as matching WhatsApp numbers appear.',
    bullets: [
      'Works only in Include Mode',
      'Matches against existing Attio contacts',
      'Auto-added numbers labeled for tracking',
      'Toggle on or off anytime',
    ],
  },
  {
    icon: ShieldAlert,
    title: 'Sync Sharing Mode',
    body: 'Choose whether Attio receives full conversation notes or metadata only. Metadata Only keeps timestamps, counts, direction, links, and agent info without message body text.',
    bullets: [
      'Full Access for complete notes',
      'Metadata Only for privacy-sensitive teams',
    ],
  },
  {
    icon: Search,
    title: 'Phone Match Fields',
    body: 'Configure which Attio fields are used to match WhatsApp numbers to existing CRM contacts. The standard phone field is used by default.',
  },
  {
    icon: Clock,
    title: 'Timezone Settings',
    body: 'Set your timezone so message timestamps in Attio notes display in your local time.',
  },
  {
    icon: Users,
    title: 'Team Access',
    body: 'Invite team members to share the Attio CRM connection. The owner manages Attio and sync settings, while each member connects their own WhatsApp account.',
    bullets: [
      'Owner and member role system',
      'Invite codes with limits',
      'Expiry dates on invites',
      'Revoke invites anytime',
    ],
  },
  {
    icon: Link2,
    title: 'Magic Access Link',
    body: 'No passwords needed. WhatSync generates a unique private access link that can be copied, revealed, and hidden. Treat it like a password.',
    image: '/access_link.png',
  },
  {
    icon: Zap,
    title: 'Real-Time Sync',
    body: 'Messages appear in Attio within seconds after they are sent or received, so your CRM has the latest conversation context.',
  },
  {
    icon: ArrowRightLeft,
    title: '14 Custom Attio Fields',
    body: 'WhatSync creates custom fields on Attio Person records for last messages, dates, counts, agent info, direct WhatsApp links, and reporting.',
  },
] as const satisfies readonly Feature[];

const faqs = [
  {
    question: 'Can I exclude specific contacts from syncing?',
    answer:
      'Yes. Once WhatsApp is connected, use the number filtering settings to exclude specific numbers or switch to Include Mode for stricter control.',
  },
  {
    question: 'Where do synced chats appear in Attio?',
    answer:
      'Chats sync to People records. Sort the People object by Last WhatsApp Message At in descending order to see the most recent conversations first.',
  },
  {
    question: 'Can I use this with a team?',
    answer:
      'Yes. The owner manages the Attio workspace connection and sync settings, while team members connect their own WhatsApp accounts.',
  },
  {
    question: 'How can I get support?',
    answer:
      'Use the contact link in the footer or email hello@appstronauts.shop for help with setup, sync behavior, and account access.',
  },
] as const;

function DocsPage() {
  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-20 px-4 py-16 sm:px-6 md:py-24">
        <section className="flex flex-col gap-4">
          <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] md:text-6xl">
            Documentation
          </h1>
          <p className="max-w-2xl text-base font-normal leading-normal text-muted-foreground md:text-lg">
            Everything you need to know about syncing WhatsApp conversations to
            Attio CRM in real time.
          </p>
        </section>

        <section className="flex flex-col gap-8">
          <SectionHeader
            title="Video Walkthroughs"
            description="Watch step-by-step guides to get up and running in minutes."
          />
          <div className="space-y-6">
            <VideoEmbed
              label="Integration Walkthrough"
              src="https://www.loom.com/embed/edc903eaa06640d7beed1acc02d305f8"
              title="Integration walkthrough"
            />
            <VideoEmbed
              label="Full YouTube Tutorial"
              src="https://www.youtube.com/embed/e1GfitS2yZM"
              title="How to connect WhatsApp to Attio CRM and sync your chats"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </section>

        <section id="find-your-chats" className="scroll-mt-24 flex flex-col gap-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl">
                Where Your Chats Show Up
              </h2>
              <p className="font-normal text-muted-foreground">
                If WhatsApp connected successfully but you do not see chats right
                away in Attio, this is the view to check first.
              </p>
            </div>
            <CopyAnchorLinkButton hash="#find-your-chats" />
          </div>

          <div className="section-container">
            <div className="section-header">
              <div className="section-dots">
                <div className="section-dot bg-red-500" />
                <div className="section-dot bg-yellow-500" />
                <div className="section-dot bg-green-500" />
              </div>
              <span className="text-sm font-medium text-neutral-500">
                One-Time Setup Tip
              </span>
              <div className="w-10" />
            </div>

            <div className="space-y-6 p-6 md:p-8">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold leading-tight tracking-[-0.015em] md:text-3xl">
                  See Latest Chats In Attio
                </h3>
                <p className="text-sm font-normal leading-7 text-muted-foreground md:text-base">
                  Your WhatsApp chats sync into the <strong>People</strong> object
                  in Attio. To see the most recent activity first, sort the list
                  by <strong>Last WhatsApp Message At</strong> in descending
                  order.
                </p>
              </div>

              <div className="grid gap-1 md:grid-cols-3">
                {[
                  'Open the People object in Attio.',
                  'Add a sort on Last WhatsApp Message At.',
                  'Set it to Descending to keep newest chats at the top.',
                ].map((step, index) => (
                  <Card className="rounded-none p-4" key={step}>
                    <p className="text-xs font-bold text-muted-foreground">
                      Step {index + 1}
                    </p>
                    <p className="mt-2 text-sm font-medium leading-6">{step}</p>
                  </Card>
                ))}
              </div>

              <ImageFrame
                alt="How to sort the People table in Attio by Last WhatsApp Message At"
                src="/image.png"
              />

              <Card className="space-y-3 rounded-none p-4 md:p-5">
                <p className="text-sm font-normal leading-7 text-muted-foreground md:text-base">
                  Inside each matching Person record, WhatsApp messages are also
                  saved as <strong>Attio notes</strong>. The People list helps
                  you find the right contact fast, and the record itself holds
                  the synced conversation history.
                </p>
                <ImageFrame
                  alt="WhatsApp chats saved as Attio notes inside a person record"
                  src="/attio-notes.png"
                />
              </Card>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <SectionHeader
            title="Features"
            description="A detailed breakdown of everything WhatSync can do."
          />
          <div className="space-y-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title="Attio Fields Reference"
            description="Attio UI shows the Display Name. API calls and filters use the API Slug."
          />

          <div className="section-container">
            <div className="section-header">
              <div className="section-dots">
                <div className="section-dot bg-red-500" />
                <div className="section-dot bg-yellow-500" />
                <div className="section-dot bg-green-500" />
              </div>
              <span className="text-sm font-medium text-neutral-500">
                Fields
              </span>
              <div className="w-10" />
            </div>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1000px] table-fixed border-collapse">
                <colgroup>
                  <col className="w-[22%]" />
                  <col className="w-[26%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[32%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {[
                      'Display Name',
                      'API Slug',
                      'Type',
                      'Status',
                      'Use Case',
                    ].map((heading) => (
                      <th
                        className="px-4 py-3 text-left text-xs font-bold text-muted-foreground"
                        key={heading}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attioFields.map((field) => (
                    <tr
                      className="border-b border-border last:border-b-0 hover:bg-muted/30"
                      key={field.slug}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {field.title}
                      </td>
                      <td className="break-all px-4 py-3 font-mono text-sm">
                        {field.slug}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{field.type}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-green-600 text-xs text-white hover:bg-green-600">
                          Active
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {field.useCase}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title="How It Works"
            description="Get set up in under 2 minutes."
          />
          <div className="grid grid-cols-1 gap-1 md:grid-cols-3">
            <SetupStep
              body="Connect your WhatsApp account with Linked WhatsApp or the official WhatsApp Business API path."
              index="01"
              title="Connect WhatsApp"
            />
            <SetupStep
              body="One-click OAuth connection to your Attio workspace."
              index="02"
              title="Connect Attio"
            />
            <SetupStep
              body="Every WhatsApp message now syncs to Attio CRM automatically."
              index="03"
              title="Messages Sync"
            />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader
            title="FAQ"
            description="Common questions about setup and sync behavior."
          />
          <div className="space-y-1">
            {faqs.map((faq) => (
              <details
                className="group border border-border bg-card p-4 open:bg-muted/30"
                key={faq.question}
              >
                <summary className="cursor-pointer list-none text-sm font-bold leading-tight">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm font-normal leading-6 text-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-6 bg-card py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl max-w-xl">
            Ready to Get Started?
          </h2>
          <p className="font-normal text-muted-foreground max-w-md">
            Set up the WhatsApp-Attio integration in under 2 minutes.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/dashboard">Connect Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:hello@appstronauts.shop">Contact Support</a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function SectionHeader({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl">
        {title}
      </h2>
      <p className="text-base font-normal leading-normal max-w-2xl text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function VideoEmbed({
  allow,
  label,
  src,
  title,
}: {
  allow?: string;
  label: string;
  src: string;
  title: string;
}) {
  return (
    <div className="section-container">
      <div className="section-header">
        <div className="section-dots">
          <div className="section-dot bg-red-500" />
          <div className="section-dot bg-yellow-500" />
          <div className="section-dot bg-green-500" />
        </div>
        <span className="text-sm font-medium text-neutral-500">{label}</span>
        <div className="w-10" />
      </div>
      <div className="relative aspect-video">
        <iframe
          allow={allow}
          allowFullScreen
          className="absolute inset-0 h-full w-full"
          src={src}
          title={title}
        />
      </div>
    </div>
  );
}

function ImageFrame({ alt, src }: { alt: string; src: string }) {
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden border border-border bg-muted/30 md:aspect-[21/9]">
      <img alt={alt} className="h-full w-full object-contain" src={src} />
    </div>
  );
}

function FeatureCard({
  body,
  bullets,
  callout,
  icon: Icon,
  image,
  title,
}: Feature) {
  return (
    <Card className="rounded-none p-6 md:p-8">
      <div className="flex items-start gap-4">
        <div className="mt-1 shrink-0">
          <div className="text-primary bg-primary/10 rounded-none p-3 flex items-center justify-center">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <h3 className="text-lg font-bold leading-tight">
            {title}
          </h3>
          <p className="text-sm font-normal leading-relaxed text-muted-foreground">
            {body}
          </p>
          {callout ? (
            <div className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
              <ShieldAlert className="h-4 w-4" />
              {callout}
            </div>
          ) : null}
          {bullets ? (
            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              {bullets.map((bullet) => (
                <div className="flex items-start gap-2 text-sm" key={bullet}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          ) : null}
          {title === 'Sync Sharing Mode' ? (
            <div className="grid gap-1 pt-2 sm:grid-cols-2">
              <SharingModeCard
                body="Syncs full conversation notes including message content, timestamps, counts, direction, agent info, and conversation links."
                icon={Eye}
                title="Full Access"
              />
              <SharingModeCard
                body="Syncs interaction metadata without writing chat note content or message body text into Attio."
                icon={EyeOff}
                title="Metadata Only"
              />
            </div>
          ) : null}
          {image ? (
            <div className="max-w-2xl pt-2">
              <ImageFrame
                alt="Magic access link card in the dashboard"
                src={image}
              />
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}

function SharingModeCard({
  body,
  icon: Icon,
  title,
}: {
  body: string;
  icon: typeof Eye;
  title: string;
}) {
  return (
    <Card className="flex items-start gap-3 rounded-none p-4">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <div>
        <p className="mb-1 text-sm font-bold leading-tight">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </Card>
  );
}

function SetupStep({
  body,
  index,
  title,
}: {
  body: string;
  index: string;
  title: string;
}) {
  return (
    <Card className="rounded-none p-6">
      <div className="mb-2 text-4xl font-black text-primary/20">{index}</div>
      <h3 className="mb-2 text-lg font-bold leading-tight">
        {title}
      </h3>
      <p className="text-sm font-normal text-muted-foreground">{body}</p>
    </Card>
  );
}

function CopyAnchorLinkButton({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button
      aria-label="Copy section link"
      variant="outline"
      size="sm"
      className="w-fit gap-2"
      onClick={handleCopy}
    >
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? 'Copied' : 'Copy Link'}
    </Button>
  );
}
