import { useEffect, useState } from 'react';

export const MOBILE_BREAKPOINT = 768;

export function useIsMobile(maxWidth: number = MOBILE_BREAKPOINT): boolean {
  const getMatches = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= maxWidth;
  };

  const [isMobile, setIsMobile] = useState<boolean>(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleResize = () => {
      setIsMobile(window.innerWidth <= maxWidth);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [maxWidth]);

  return isMobile;
}
