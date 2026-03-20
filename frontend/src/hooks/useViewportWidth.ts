import { useEffect, useState } from 'react';

function getViewportWidth() {
  if (typeof window === 'undefined') return 1280;
  return window.innerWidth;
}

export function useViewportWidth(): number {
  const [viewportWidth, setViewportWidth] = useState<number>(getViewportWidth);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewportWidth;
}
