import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

export function Navbar() {
  return (
    <header className="flex items-center justify-between whitespace-nowrap py-4 sticky top-0 bg-background/80 backdrop-blur-sm z-50 border-b">
      <div className="flex items-center gap-4">
        <div className="size-6 text-green-600">
          <svg
            aria-hidden="true"
            fill="none"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-green-600">
          WhatSync
        </h2>
      </div>
      <div className="hidden md:flex flex-1 justify-end gap-8">
        {/* <div className="flex items-center gap-9">
          <a
            className="text-sm font-medium leading-normal hover:text-primary"
            href="#"
          >
            Product
          </a>
          <a
            className="text-sm font-medium leading-normal hover:text-primary"
            href="#"
          >
            Use Cases
          </a>
          <a
            className="text-sm font-medium leading-normal hover:text-primary"
            href="#"
          >
            Pricing
          </a>
          <a
            className="text-sm font-medium leading-normal hover:text-primary"
            href="#"
          >
            Integrations
          </a>
        </div> */}
        <Button>
          <Link to="/dashboard">Get Access</Link>
        </Button>
      </div>
      {/* <Button variant="default" size="sm" className="md:hidden">
        <span className="material-symbols-outlined text-xl">menu</span>
      </Button> */}

      <Button className="md:hidden">
        <Link to="/dashboard">Get Access</Link>
      </Button>
    </header>
  );
}
