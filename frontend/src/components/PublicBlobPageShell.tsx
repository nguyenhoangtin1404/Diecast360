import type { ReactNode } from 'react';

/**
 * Shared outer shell for public pages: blob backdrop + max-w-7xl content area
 * (same pattern as PublicCatalogPage).
 */
type PublicBlobPageShellProps = {
  children: ReactNode;
};

export const PublicBlobPageShell = ({ children }: PublicBlobPageShellProps) => {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-shop/40 to-shopAccent/25 blur-3xl motion-safe:animate-blob-drift"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-32 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-shopAccent/25 to-shop/20 blur-3xl motion-safe:animate-blob-drift [animation-delay:-6s]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">{children}</div>
    </div>
  );
};
