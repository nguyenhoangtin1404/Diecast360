import type { FC } from 'react';
import { useSyncExternalStore } from 'react';
import { cn } from '../../lib/utils';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function subscribePrefersReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onStoreChange);
  return () => mq.removeEventListener('change', onStoreChange);
}

type ShopLoadingRingSvgProps = {
  className?: string;
  /** Max edge length in CSS px (viewBox stays 0–100). Default 200. */
  pixelSize?: number;
};

/**
 * Dual expanding-ring loader (SMIL) from loading.io — two stroked circles with r/opacity animation.
 * When `prefers-reduced-motion: reduce`, shows static rings (no SMIL).
 */
export const ShopLoadingRingSvg: FC<ShopLoadingRingSvgProps> = ({ className, pixelSize = 200 }) => {
  const reducedMotion = useSyncExternalStore(subscribePrefersReducedMotion, prefersReducedMotion, () => false);

  const size = `min(${pixelSize}px, 92vw)`;

  return (
    <svg
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      width={pixelSize}
      height={pixelSize}
      focusable="false"
      aria-hidden
      style={{
        shapeRendering: 'auto',
        display: 'block',
        background: 'transparent',
        maxWidth: size,
        maxHeight: `min(${pixelSize}px, 85vh)`,
        width: size,
        height: size,
      }}
    >
      <g>
        {reducedMotion ? (
          <>
            <circle strokeWidth="2" stroke="#e90c59" fill="none" r="28" cy="50" cx="50" opacity={0.45} />
            <circle strokeWidth="2" stroke="#46dff0" fill="none" r="18" cy="50" cx="50" opacity={0.55} />
          </>
        ) : (
          <>
            <circle strokeWidth="2" stroke="#e90c59" fill="none" r="0" cy="50" cx="50">
              <animate
                begin="0s"
                calcMode="spline"
                keySplines="0 0.2 0.8 1"
                keyTimes="0;1"
                values="0;40"
                dur="1s"
                repeatCount="indefinite"
                attributeName="r"
              />
              <animate
                begin="0s"
                calcMode="spline"
                keySplines="0.2 0 0.8 1"
                keyTimes="0;1"
                values="1;0"
                dur="1s"
                repeatCount="indefinite"
                attributeName="opacity"
              />
            </circle>
            <circle strokeWidth="2" stroke="#46dff0" fill="none" r="0" cy="50" cx="50">
              <animate
                begin="-0.5s"
                calcMode="spline"
                keySplines="0 0.2 0.8 1"
                keyTimes="0;1"
                values="0;40"
                dur="1s"
                repeatCount="indefinite"
                attributeName="r"
              />
              <animate
                begin="-0.5s"
                calcMode="spline"
                keySplines="0.2 0 0.8 1"
                keyTimes="0;1"
                values="1;0"
                dur="1s"
                repeatCount="indefinite"
                attributeName="opacity"
              />
            </circle>
          </>
        )}
      </g>
    </svg>
  );
};
