import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export function Hero() {
  return (
    <div className="flex flex-col gap-4 text-center items-center py-20 md:py-32 relative">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] md:text-6xl">
          Your WhatsApp Conversations, <br />{' '}
          <span className="inline-block rotate-[-2deg] bg-green-600 p-2 text-secondary">
            Automatically
          </span>{' '}
          in Attio.
        </h1>
        <p className="text-base font-normal leading-normal md:text-lg max-w-2xl mx-auto text-muted-foreground">
          Streamline your workflow by bringing WhatsApp conversations directly
          into Attio. Automate follow-ups, track interactions, and close deals
          faster.
        </p>
      </div>
      <Button size="lg" className="mt-4">
        <Link to="/dashboard">Get Access</Link>
      </Button>
    </div>
  );
}
