import { useEffect, useState } from 'react';

export const COMPACT_MOBILE_BREAKPOINT = 900;

export function useIsCompactMobile(maxWidth = COMPACT_MOBILE_BREAKPOINT): boolean {
  const getMatches = () =>
    typeof window !== 'undefined' && window.matchMedia(`(max-width: ${maxWidth}px)`).matches;

  const [isCompactMobile, setIsCompactMobile] = useState(getMatches);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia(`(max-width: ${maxWidth}px)`);
    const handleChange = (event: MediaQueryListEvent) => setIsCompactMobile(event.matches);

    setIsCompactMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [maxWidth]);

  return isCompactMobile;
}
