import { useEffect } from 'react';
import { ProfessionType } from '../contexts/AuthContext';
import { getRouteByProfession } from '../config/professionRoutes';

interface ManifestUpdaterProps {
    profession: ProfessionType | null;
}

export default function ManifestUpdater({ profession }: ManifestUpdaterProps) {
    useEffect(() => {
        if (!profession) return;

        const config = getRouteByProfession(profession);
        if (!config) return;

        const manifestHref = config.manifestPath || '/manifest.json';

        let link = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
        if (!link) {
            link = document.createElement('link');
            link.rel = 'manifest';
            document.head.appendChild(link);
        }
        link.href = manifestHref;

        setMeta('theme-color', config.themeColor);
        setMeta('application-name', config.name);
        setMeta('apple-mobile-web-app-capable', 'yes');
        setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
        setMeta('apple-mobile-web-app-title', config.shortName);

        let touchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
        if (!touchIcon) {
            touchIcon = document.createElement('link');
            touchIcon.rel = 'apple-touch-icon';
            document.head.appendChild(touchIcon);
        }
        touchIcon.href = '/icons/icon-192.png';

        document.title = `${config.name} — Smart Professional Tools`;
    }, [profession]);

    return null;
}

function setMeta(name: string, content: string): void {
    let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
    }
    meta.content = content;
}
