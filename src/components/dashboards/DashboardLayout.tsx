import React, { useState } from 'react';
import { ProfessionType } from '../../contexts/AuthContext';

interface NavItem {
    id: string;
    label: string;
    icon: string;
}

interface DashboardLayoutProps {
    profession: ProfessionType;
    professionLabel: string;
    professionIcon: string;
    userName: string;
    navItems: NavItem[];
    activeNav: string;
    onNavChange: (id: string) => void;
    onChangeProfession: () => void;
    onLogout: () => void;
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    profession,
    professionLabel,
    professionIcon,
    userName,
    navItems,
    activeNav,
    onNavChange,
    onChangeProfession,
    onLogout,
    children,
}) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div style={styles.wrapper}>
            {/* Sidebar */}
            <aside
                style={{
                    ...styles.sidebar,
                    width: sidebarCollapsed ? 64 : 240,
                }}
            >
                {/* Logo */}
                <div style={styles.sidebarHeader}>
                    {!sidebarCollapsed && (
                        <div>
                            <div style={styles.logoText}>🇱🇰 MyTracksy</div>
                            <div style={styles.logoSubtext}>SaaS Finance</div>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        style={styles.collapseBtn}
                        title={sidebarCollapsed ? 'Expand' : 'Collapse'}
                    >
                        {sidebarCollapsed ? '→' : '←'}
                    </button>
                </div>

                {/* Nav Items */}
                <nav style={styles.nav}>
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavChange(item.id)}
                            style={{
                                ...styles.navItem,
                                ...(activeNav === item.id ? styles.navItemActive : {}),
                                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                            }}
                            title={item.label}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                            {!sidebarCollapsed && (
                                <span style={styles.navLabel}>{item.label}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Footer */}
                {!sidebarCollapsed && (
                    <div style={styles.sidebarFooter}>
                        <button onClick={onChangeProfession} style={styles.footerBtn}>
                            🔄 Change Profession
                        </button>
                        <button
                            onClick={onLogout}
                            style={{ ...styles.footerBtn, ...styles.logoutBtn }}
                        >
                            🚪 Logout
                        </button>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <div
                style={{
                    ...styles.main,
                    marginLeft: sidebarCollapsed ? 64 : 240,
                }}
            >
                {/* Top Bar */}
                <header style={styles.topBar}>
                    <div style={styles.topBarLeft}>
                        <h1 style={styles.pageTitle}>
                            {navItems.find((n) => n.id === activeNav)?.icon}{' '}
                            {navItems.find((n) => n.id === activeNav)?.label}
                        </h1>
                    </div>
                    <div style={styles.topBarRight}>
                        <span style={styles.professionBadge}>
                            {professionIcon} {professionLabel}
                        </span>
                        <span style={styles.userName}>👋 {userName}</span>
                    </div>
                </header>

                {/* Page Content */}
                <main style={styles.content}>{children}</main>
            </div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: '#f0f2f5',
    },
    sidebar: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        height: '100vh',
        background: 'linear-gradient(180deg, #1a1f36 0%, #24293e 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column' as const,
        zIndex: 100,
        transition: 'width 0.3s ease',
        overflowX: 'hidden' as const,
    },
    sidebarHeader: {
        padding: '1.25rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        minHeight: 64,
    },
    logoText: {
        fontSize: '1.1rem',
        fontWeight: 700,
        whiteSpace: 'nowrap' as const,
    },
    logoSubtext: {
        fontSize: '0.7rem',
        opacity: 0.6,
        marginTop: 2,
    },
    collapseBtn: {
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        color: 'white',
        width: 28,
        height: 28,
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        flexShrink: 0,
    },
    nav: {
        flex: 1,
        padding: '0.75rem 0.5rem',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 4,
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.65rem 0.75rem',
        border: 'none',
        background: 'transparent',
        color: 'rgba(255,255,255,0.65)',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s ease',
        textAlign: 'left' as const,
        width: '100%',
        whiteSpace: 'nowrap' as const,
    },
    navItemActive: {
        background: 'rgba(99, 102, 241, 0.2)',
        color: '#818cf8',
        fontWeight: 600,
    },
    navLabel: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    sidebarFooter: {
        padding: '0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 6,
    },
    footerBtn: {
        width: '100%',
        padding: '0.5rem',
        background: 'rgba(255,255,255,0.08)',
        border: 'none',
        color: 'rgba(255,255,255,0.7)',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: '0.78rem',
        textAlign: 'left' as const,
    },
    logoutBtn: {
        color: '#f87171',
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'margin-left 0.3s ease',
    },
    topBar: {
        height: 60,
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky' as const,
        top: 0,
        zIndex: 50,
    },
    topBarLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    pageTitle: {
        fontSize: '1.15rem',
        fontWeight: 600,
        color: '#1e293b',
        margin: 0,
    },
    topBarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
    },
    professionBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.3rem',
        padding: '4px 12px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        color: 'white',
        fontSize: '0.78rem',
        fontWeight: 600,
    },
    userName: {
        fontSize: '0.88rem',
        color: '#64748b',
        fontWeight: 500,
    },
    content: {
        flex: 1,
        padding: '1.5rem',
    },
};

export default DashboardLayout;
