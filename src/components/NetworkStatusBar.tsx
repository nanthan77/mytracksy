import React, { useState, useEffect } from 'react';
import { offlineBridge } from '../services/firestoreOfflineBridge';

/**
 * NetworkStatusBar — shows online/offline/syncing status at the top of the app.
 * - 🟢 Online (green)
 * - 🟡 Syncing (amber, with pending count)
 * - 🔴 Offline (red, with pending count badge)
 */
const NetworkStatusBar: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [lastSync, setLastSync] = useState<number | null>(null);

    useEffect(() => {
        const listener = (status: { pending: number; syncing: boolean; lastSync: number | null }) => {
            setPendingCount(status.pending);
            setIsSyncing(status.syncing);
            setLastSync(status.lastSync);
        };

        offlineBridge.addListener(listener);

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => {
            setIsOnline(false);
            setIsVisible(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        offlineBridge.getPendingCount().then(setPendingCount);

        return () => {
            offlineBridge.removeListener(listener);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Show bar when offline or when there are pending items
    useEffect(() => {
        if (!isOnline || pendingCount > 0 || isSyncing) {
            setIsVisible(true);
        } else {
            // Hide after 3 seconds of being fully synced and online
            const timer = setTimeout(() => setIsVisible(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, pendingCount, isSyncing]);

    if (!isVisible) return null;

    const getStatusConfig = () => {
        if (!isOnline) {
            return {
                bg: 'linear-gradient(90deg, #e74c3c 0%, #c0392b 100%)',
                icon: '📡',
                text: 'Offline Mode',
                detail: pendingCount > 0 ? `${pendingCount} items waiting to sync` : 'Changes saved locally',
            };
        }
        if (isSyncing) {
            return {
                bg: 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)',
                icon: '🔄',
                text: 'Syncing...',
                detail: `Uploading ${pendingCount} items`,
            };
        }
        if (pendingCount > 0) {
            return {
                bg: 'linear-gradient(90deg, #f39c12 0%, #e67e22 100%)',
                icon: '⏳',
                text: 'Sync Pending',
                detail: `${pendingCount} items to upload`,
            };
        }
        return {
            bg: 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)',
            icon: '✅',
            text: 'All Synced',
            detail: lastSync ? `Last sync: ${formatTime(lastSync)}` : 'Up to date',
        };
    };

    const config = getStatusConfig();

    return (
        <div style={{
            background: config.bg,
            color: '#fff',
            padding: '6px 16px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontFamily: "'Inter', -apple-system, sans-serif",
            fontWeight: 500,
            letterSpacing: '0.02em',
            zIndex: 9999,
            position: 'sticky' as const,
            top: 0,
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}>
            <span style={{ fontSize: '0.9rem' }}>{config.icon}</span>
            <span>{config.text}</span>
            <span style={{ opacity: 0.8, fontSize: '0.75rem' }}>— {config.detail}</span>

            {pendingCount > 0 && (
                <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    borderRadius: '10px',
                    padding: '1px 8px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                }}>
                    {pendingCount}
                </span>
            )}

            {!isOnline && (
                <button
                    onClick={() => offlineBridge.syncAll()}
                    style={{
                        marginLeft: '8px',
                        padding: '2px 10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                    }}
                >
                    Retry
                </button>
            )}
        </div>
    );
};

function formatTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default NetworkStatusBar;
