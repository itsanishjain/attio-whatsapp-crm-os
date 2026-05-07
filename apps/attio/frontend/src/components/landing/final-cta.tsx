import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export function FinalCTA() {
  return (
    <div className="flex flex-col gap-6 text-center items-center py-20 md:py-24 bg-card mb-20 relative">
      <h2 className="text-3xl font-bold leading-tight tracking-[-0.015em] md:text-4xl max-w-xl">
        Start syncing WhatsApp with Attio today.
      </h2>
      <Button size="lg" className="mt-4" asChild>
        <Link to="/dashboard">Get Started Now</Link>
      </Button>
    </div>
  );
}
