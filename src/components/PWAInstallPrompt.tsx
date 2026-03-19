import { useState, useEffect } from 'react';
import { ProfessionType } from '../types/profession';
import { getRouteByProfession } from '../config/professionRoutes';

interface PWAInstallPromptProps {
    profession: ProfessionType;
    layoutContext?: 'default' | 'dashboard';
}

export default function PWAInstallPrompt({ profession, layoutContext = 'default' }: PWAInstallPromptProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [installed, setInstalled] = useState(false);

    const config = getRouteByProfession(profession);
    const dismissKey = config ? `pwa-install-dismissed:v2:${config.slug}` : 'pwa-install-dismissed:v2';
    const isDedicatedDashboard = layoutContext === 'dashboard' && Boolean(config?.dedicatedPwa);

    useEffect(() => {
        if (!config?.dedicatedPwa) return;

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
            setInstalled(true);
            return;
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem(dismissKey);
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Also show banner after a short delay even if the prompt event hasn't fired yet.
        const timer = setTimeout(() => {
            if (!installed) {
                setShowBanner(true);
            }
        }, 3000);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            clearTimeout(timer);
        };
    }, [config?.dedicatedPwa, dismissKey, installed]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setInstalled(true);
            }
            setDeferredPrompt(null);
            setShowBanner(false);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem(dismissKey, Date.now().toString());
    };

    if (!showBanner || installed || !config?.dedicatedPwa || !config) return null;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
        <div style={{
            position: 'fixed',
            bottom: isDedicatedDashboard ? 'calc(var(--safe-area-bottom) + 88px)' : 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderTop: `3px solid ${config.themeColor}`,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}>
            <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

            {/* Icon */}
            <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${config.themeColor}22, ${config.themeColor}44)`,
                border: `2px solid ${config.themeColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
            }}>
                {config.icon}
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    color: '#f8fafc',
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: '-0.01em',
                }}>
                    Install {config.name}
                </div>
                <div style={{
                    color: '#94a3b8',
                    fontSize: 12,
                    marginTop: 2,
                }}>
                    {isIOS
                        ? 'Tap Share ⬆ then "Add to Home Screen"'
                        : deferredPrompt
                            ? 'Add to your home screen for quick access'
                            : 'Use your browser menu and tap "Install app"'
                    }
                </div>
            </div>

            {/* Actions */}
            {!isIOS && deferredPrompt && (
                <button
                    onClick={handleInstall}
                    style={{
                        background: config.themeColor,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        padding: '10px 20px',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        flexShrink: 0,
                        letterSpacing: '-0.01em',
                    }}
                >
                    Install
                </button>
            )}

            <button
                onClick={handleDismiss}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: 20,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    flexShrink: 0,
                }}
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
}
