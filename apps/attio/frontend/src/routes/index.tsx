import {
  DashboardPreview,
  Features,
  FinalCTA,
  FloatingWhatsApp,
  Footer,
  Hero,
  Integrations,
  Navbar,
  UseCases,
} from '@/components/landing';

import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Root,
});

function Root() {
  return (
    <>
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden lines-bg">
        <Navbar />
        <Hero />
        <DashboardPreview />
        <Features />
        <UseCases />
        <Integrations />
        <FinalCTA />
      </div>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
