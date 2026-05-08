import type { FC } from 'react';
import { cn } from '../../lib/utils';

/**
 * Dual expanding-ring loader (SMIL) from loading.io — two stroked circles with r/opacity animation.
 */
export const ShopLoadingRingSvg: FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={cn(className)}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid"
      width={200}
      height={200}
      focusable="false"
      aria-hidden
      style={{
        shapeRendering: 'auto',
        display: 'block',
        background: 'rgb(255, 255, 255)',
        maxWidth: 'min(200px, 92vw)',
        maxHeight: 'min(200px, 85vh)',
        width: 'min(200px, 92vw)',
        height: 'min(200px, 92vw)',
      }}
    >
      <g>
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
      </g>
    </svg>
  );
};
