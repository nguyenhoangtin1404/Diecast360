import { cn } from '../lib/utils';

/** Shared gradient tile when no custom logo (public + admin). */
export function BrandFallbackTile({ className }: { className: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center bg-gradient-to-br from-shop to-shopAccent font-extrabold tracking-tight text-white shadow-corporate-btn',
        className,
      )}
    >
      360°
    </div>
  );
}
