import { useViewportWidth } from './useViewportWidth';

export const MOBILE_BREAKPOINT = 768;

export function useIsMobile(maxWidth: number = MOBILE_BREAKPOINT): boolean {
  const viewportWidth = useViewportWidth();
  return viewportWidth <= maxWidth;
}
