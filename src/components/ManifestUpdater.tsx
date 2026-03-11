import { useEffect } from 'react';
import { ProfessionType } from '../contexts/AuthContext';
import { getRouteByProfession, ProfessionRouteConfig } from '../config/professionRoutes';

interface ManifestUpdaterProps {
    profession: ProfessionType | null;
}

/** Profession-specific PWA shortcuts */
const PROFESSION_SHORTCUTS: Record<string, Array<{ name: string; short_name: string; description: string; icon: string; action: string }>> = {
    medical: [
        { name: 'Voice Note', short_name: 'Voice', description: 'Record a clinical note', icon: '🎙️', action: 'voicevault' },
        { name: 'Ward Round', short_name: 'Rounds', description: "Today's ward round checklist", icon: '🌅', action: 'briefing' },
        { name: 'Smart Scheduler', short_name: 'Schedule', description: 'View shift schedule', icon: '📅', action: 'scheduler' },
        { name: 'Quick Income', short_name: 'Income', description: 'Log channeling income', icon: '💰', action: 'income' },
    ],
    legal: [
        { name: 'New Case', short_name: 'Case', description: 'Create a new case file', icon: '📂', action: 'cases' },
        { name: 'Billing', short_name: 'Bill', description: 'Quick time billing', icon: '⏱️', action: 'income' },
        { name: 'Voice Note', short_name: 'Voice', description: 'Record case note', icon: '🎙️', action: 'voicevault' },
        { name: 'Calendar', short_name: 'Calendar', description: 'Court dates', icon: '📅', action: 'scheduler' },
    ],
    engineering: [
        { name: 'Site Log', short_name: 'Log', description: 'Quick site update', icon: '📝', action: 'quicknotes' },
        { name: 'Expenses', short_name: 'Expense', description: 'Log project expense', icon: '💸', action: 'expenses' },
        { name: 'Voice Note', short_name: 'Voice', description: 'Voice input', icon: '🎙️', action: 'voice' },
        { name: 'Dashboard', short_name: 'Home', description: 'Project overview', icon: '📊', action: 'overview' },
    ],
    business: [
        { name: 'Quick Invoice', short_name: 'Invoice', description: 'Create invoice', icon: '📄', action: 'income' },
        { name: 'Expenses', short_name: 'Expense', description: 'Log expense', icon: '💸', action: 'expenses' },
        { name: 'Voice Command', short_name: 'Voice', description: 'Voice input', icon: '🎙️', action: 'voice' },
        { name: 'Reports', short_name: 'Reports', description: 'Business analytics', icon: '📋', action: 'reports' },
    ],
};

function generateManifest(config: ProfessionRouteConfig): string {
    const shortcuts = (PROFESSION_SHORTCUTS[config.profession] || [
        { name: 'Voice Command', short_name: 'Voice', description: 'Quick voice input', icon: '🎙️', action: 'voice' },
        { name: 'Dashboard', short_name: 'Home', description: 'Go to dashboard', icon: '📊', action: 'overview' },
    ]).map(s => ({
        name: s.name,
        short_name: s.short_name,
        description: s.description,
        url: `/${config.slug}?action=${s.action}`,
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    }));

    const manifest = {
        name: config.name,
        short_name: config.shortName,
        description: config.description,
        start_url: `/${config.slug}`,
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: config.themeColor,
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'en-LK',
        dir: 'ltr',
        id: `tracksy-${config.slug}`,
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
        shortcuts,
        share_target: {
            action: `/${config.slug}?action=share`,
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
                title: 'title',
                text: 'text',
                url: 'url',
                files: [
                    {
                        name: 'media',
                        accept: ['image/*', 'audio/*', 'application/pdf'],
                    },
                ],
            },
        },
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

        // ─── Apple-specific PWA meta tags ────────────────────────
        setMeta('apple-mobile-web-app-capable', 'yes');
        setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
        setMeta('apple-mobile-web-app-title', config.shortName);

        // Apple touch icon
        let touchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
        if (!touchIcon) {
            touchIcon = document.createElement('link');
            touchIcon.rel = 'apple-touch-icon';
            document.head.appendChild(touchIcon);
        }
        touchIcon.href = '/icons/icon-192.png';

        // Update page title
        document.title = `${config.name} — Smart Professional Tools`;

        return () => {
            URL.revokeObjectURL(manifestUrl);
        };
    }, [profession]);

    return null; // Headless component
}

function setMeta(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
    }
    meta.content = content;
}
