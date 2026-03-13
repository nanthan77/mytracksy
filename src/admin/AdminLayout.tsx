/**
 * AdminLayout.tsx — Dark sidebar layout for admin panel
 */

import { useState } from 'react';
import { User } from 'firebase/auth';
import AdminDashboard from './AdminDashboard';
import UserDirectory from './DoctorDirectory';
import TaxEngineEditor from './TaxEngineEditor';
import AIUsageMonitor from './AIUsageMonitor';
import PushNotificationSender from './PushNotificationSender';

interface AdminLayoutProps {
    user: User;
    onLogout: () => void;
}

type AdminPage = 'dashboard' | 'users' | 'tax' | 'ai' | 'push';

const navItems: { id: AdminPage; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'tax', label: 'Tax Engine', icon: '🧾' },
    { id: 'ai', label: 'AI Monitor', icon: '🤖' },
    { id: 'push', label: 'Push Alerts', icon: '📢' },
];

export default function AdminLayout({ user, onLogout }: AdminLayoutProps) {
    const [activePage, setActivePage] = useState<AdminPage>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <AdminDashboard />;
            case 'users': return <UserDirectory />;
            case 'tax': return <TaxEngineEditor />;
            case 'ai': return <AIUsageMonitor />;
            case 'push': return <PushNotificationSender />;
            default: return <AdminDashboard />;
        }
    };

    const s: Record<string, React.CSSProperties> = {
        container: {
            display: 'flex',
            minHeight: '100vh',
            background: '#0f172a',
            fontFamily: "'Inter', system-ui, sans-serif",
            color: '#e2e8f0',
        },
        sidebar: {
            width: '240px',
            background: '#1e1b4b',
            borderRight: '1px solid rgba(139,92,246,0.2)',
            display: 'flex',
            flexDirection: 'column' as const,
            position: 'fixed' as const,
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 100,
            transition: 'transform 0.3s ease',
        },
        sidebarMobileHidden: {
            transform: 'translateX(-100%)',
        },
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99,
        },
        logo: {
            padding: '1.5rem',
            borderBottom: '1px solid rgba(139,92,246,0.2)',
        },
        logoText: {
            fontSize: '1.1rem',
            fontWeight: 800,
            color: '#fff',
            margin: 0,
        },
        logoSub: {
            fontSize: '0.7rem',
            color: '#8b5cf6',
            margin: '0.15rem 0 0',
        },
        nav: {
            flex: 1,
            padding: '1rem 0.75rem',
        },
        navItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.7rem 0.75rem',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 500,
            transition: 'background 0.2s',
            border: 'none',
            width: '100%',
            textAlign: 'left' as const,
            color: '#94a3b8',
            background: 'none',
        },
        navItemActive: {
            background: 'rgba(99,102,241,0.2)',
            color: '#c7d2fe',
            fontWeight: 600,
        },
        userSection: {
            padding: '1rem 0.75rem',
            borderTop: '1px solid rgba(139,92,246,0.2)',
        },
        userEmail: {
            color: '#94a3b8',
            fontSize: '0.7rem',
            display: 'block',
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '0.5rem',
        },
        logoutBtn: {
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            color: '#fca5a5',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
        },
        main: {
            flex: 1,
            marginLeft: '240px',
            padding: '1.5rem',
            minHeight: '100vh',
            overflowX: 'auto' as const,
        },
        hamburger: {
            display: 'none',
            position: 'fixed' as const,
            top: '1rem',
            left: '1rem',
            zIndex: 101,
            background: '#1e1b4b',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            color: '#fff',
            fontSize: '1.2rem',
            cursor: 'pointer',
        },
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div style={s.container}>
            {/* Mobile hamburger */}
            <button
                style={{ ...s.hamburger, display: isMobile ? 'block' : 'none' }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                ☰
            </button>

            {/* Overlay for mobile */}
            {isMobile && sidebarOpen && (
                <div style={s.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <div style={{
                ...s.sidebar,
                ...(isMobile && !sidebarOpen ? s.sidebarMobileHidden : {}),
            }}>
                <div style={s.logo}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <img src="/logos/mytracksy-logo.png" alt="MyTracksy Logo" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                        <h1 style={s.logoText}>MyTracksy</h1>
                    </div>
                    <p style={s.logoSub}>SUPER ADMIN</p>
                </div>

                <nav style={s.nav}>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            style={{
                                ...s.navItem,
                                ...(activePage === item.id ? s.navItemActive : {}),
                            }}
                            onClick={() => {
                                setActivePage(item.id);
                                if (isMobile) setSidebarOpen(false);
                            }}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div style={s.userSection}>
                    <span style={s.userEmail}>👤 {user.email}</span>
                    <button style={s.logoutBtn} onClick={onLogout}>
                        🚪 Sign Out
                    </button>
                </div>
            </div>

            {/* Main content */}
            <main style={{ ...s.main, marginLeft: isMobile ? 0 : '240px' }}>
                {renderPage()}
            </main>
        </div>
    );
}
