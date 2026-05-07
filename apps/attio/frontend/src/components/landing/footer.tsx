import { Link } from '@tanstack/react-router';

export function Footer() {
  return (
    <footer className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-solid border-border relative">
      <div className="flex items-center gap-4">
        <div className="size-5 text-primary">
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
        <p className="text-sm text-muted-foreground">
          © 2026 WhatSync. All rights reserved.
        </p>
      </div>
      <div className="flex items-center gap-6">
        <a
          className="text-sm font-medium text-muted-foreground hover:text-primary"
          href="mailto:hello@appstronauts.shop"
        >
          Contact
        </a>
        <Link
          className="text-sm font-medium text-muted-foreground hover:text-primary"
          to="/privacy"
        >
          Privacy Policy
        </Link>
        <Link
          className="text-sm font-medium text-muted-foreground hover:text-primary"
          to="/terms"
        >
          Terms of Service
        </Link>
      </div>
    </footer>
  );
}
