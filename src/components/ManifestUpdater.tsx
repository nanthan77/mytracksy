import { useEffect } from 'react';
import { ProfessionType } from '../contexts/AuthContext';
import { getRouteByProfession, ProfessionRouteConfig } from '../config/professionRoutes';

interface ManifestUpdaterProps {
    profession: ProfessionType | null;
}

function generateManifest(config: ProfessionRouteConfig): string {
    const manifest = {
        name: config.name,
        short_name: config.shortName,
        description: config.description,
        start_url: `/${config.slug}`,
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: config.themeColor,
        orientation: 'portrait-primary',
        scope: `/${config.slug}`,
        lang: 'en-LK',
        dir: 'ltr',
        icons: [
            {
                src: '/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable',
            },
            {
                src: '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
            },
        ],
        categories: ['finance', 'productivity', 'business'],
        shortcuts: [
            {
                name: 'Voice Command',
                short_name: 'Voice',
                description: 'Quick voice input',
                url: `/${config.slug}?action=voice`,
            },
            {
                name: 'Dashboard',
                short_name: 'Home',
                description: 'Go to dashboard',
                url: `/${config.slug}`,
            },
        ],
    };

    return JSON.stringify(manifest);
}

export default function ManifestUpdater({ profession }: ManifestUpdaterProps) {
    useEffect(() => {
        if (!profession) return;

        const config = getRouteByProfession(profession);
        if (!config) return;

        // Generate dynamic manifest blob
        const manifestStr = generateManifest(config);
        const blob = new Blob([manifestStr], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(blob);

        // Update or create manifest link
        let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'manifest';
            document.head.appendChild(link);
        }
        link.href = manifestUrl;

        // Update theme-color meta tag
        let themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (!themeMeta) {
            themeMeta = document.createElement('meta');
            themeMeta.name = 'theme-color';
            document.head.appendChild(themeMeta);
        }
        themeMeta.content = config.themeColor;

        // Update page title
        document.title = `${config.name} — Smart Professional Tools`;

        return () => {
            URL.revokeObjectURL(manifestUrl);
        };
    }, [profession]);

    return null; // Headless component
}
