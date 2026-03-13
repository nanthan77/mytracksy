import { useState, useEffect, useCallback } from 'react';

/**
 * useRouteNav — Syncs dashboard activeNav state with the browser URL.
 *
 * Example: /medical/income → activeNav = 'income'
 *          /medical         → activeNav = 'overview' (default)
 *
 * When setActiveNav is called, it pushes the URL to history.
 * When browser back/forward is used, it updates activeNav.
 */
export function useRouteNav(
    validNavIds: string[],
    defaultNav: string = 'overview'
): [string, (navId: string) => void] {
    // Extract sub-path from URL: /medical/income → 'income'
    const getNavFromURL = useCallback((): string => {
        const parts = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/');
        // parts[0] = profession slug (e.g. 'medical'), parts[1] = nav section
        const subPath = parts[1] || '';
        if (subPath && validNavIds.includes(subPath)) {
            return subPath;
        }
        return defaultNav;
    }, [validNavIds, defaultNav]);

    const [activeNav, setActiveNavState] = useState<string>(getNavFromURL);

    // Get the profession slug from URL (first segment)
    const getProfessionSlug = useCallback((): string => {
        const parts = window.location.pathname.replace(/^\/+|\/+$/g, '').split('/');
        return parts[0] || '';
    }, []);

    // Update URL when nav changes
    const setActiveNav = useCallback((navId: string) => {
        setActiveNavState(navId);
        const slug = getProfessionSlug();
        if (!slug) return;

        const newPath = navId === defaultNav
            ? `/${slug}`
            : `/${slug}/${navId}`;

        // Only push if different from current
        if (window.location.pathname !== newPath) {
            window.history.pushState({ nav: navId }, '', newPath);
        }
    }, [getProfessionSlug, defaultNav]);

    // Listen for browser back/forward
    useEffect(() => {
        const handlePopState = () => {
            const navFromUrl = getNavFromURL();
            setActiveNavState(navFromUrl);
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [getNavFromURL]);

    return [activeNav, setActiveNav];
}
