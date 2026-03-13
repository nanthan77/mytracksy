import React, { useMemo, useState } from 'react';
import { ProfessionType } from '../../contexts/AuthContext';
import { useIsCompactMobile } from './useIsCompactMobile';

interface NavItem { id: string; label: string; icon: string; premium?: boolean; locked?: boolean; tierBadge?: string; }

interface MobileTabItem {
    id: string;
    label: string;
    icon: string;
}

interface MobileShellConfig {
    enabled?: boolean;
    tabs: MobileTabItem[];
    activeTab: string;
    onTabChange: (id: string) => void;
    activeTitle: string;
    activeSubtitle?: string;
    headerAction?: React.ReactNode;
    accentColor?: string;
    activeTabBackground?: string;
    background?: string;
    headerBackground?: string;
    navBackground?: string;
    subtitleColor?: string;
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
    tokenBalance?: number;
    onWalletClick?: () => void;
    mobileShell?: MobileShellConfig;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    professionLabel, professionIcon, userName, navItems, activeNav,
    onNavChange, onChangeProfession, onLogout, children, tokenBalance, onWalletClick, mobileShell,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const isCompactMobile = useIsCompactMobile();
    const sidebarWidth = collapsed ? 68 : 260;
    const activeNavItem = useMemo(
        () => navItems.find(n => n.id === activeNav) || navItems[0],
        [activeNav, navItems]
    );
    const showMobileShell = Boolean(mobileShell?.enabled && isCompactMobile);
    const mobileAccentColor = mobileShell?.accentColor || '#0ea5e9';
    const mobileActiveTabBackground = mobileShell?.activeTabBackground || 'linear-gradient(135deg, rgba(14,165,233,0.14), rgba(99,102,241,0.1))';
    const mobileBackground = mobileShell?.background || 'linear-gradient(180deg, #f8fbff 0%, #eef4ff 34%, #f8fafc 100%)';
    const mobileHeaderBackground = mobileShell?.headerBackground || 'rgba(248,251,255,0.88)';
    const mobileNavBackground = mobileShell?.navBackground || 'rgba(255,255,255,0.94)';
    const mobileSubtitleColor = mobileShell?.subtitleColor || '#64748b';

    if (showMobileShell && mobileShell) {
        return (
            <>
                <style>{`
                    @keyframes pulse-red { 0%, 100% { background: #ef4444; } 50% { background: #f87171; } }
                    .wallet-low-indicator { animation: pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                    .mobile-tab-btn {
                        border: none;
                        background: transparent;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 4px;
                        color: #94a3b8;
                        min-width: 0;
                        min-height: 56px;
                        width: 100%;
                        padding: 8px 6px;
                        border-radius: 18px;
                        transition: all 0.2s ease;
                        font-family: 'Inter', sans-serif;
                    }
                    .mobile-tab-btn.active {
                        color: #0f172a;
                        background: ${mobileActiveTabBackground};
                    }
                `}</style>

                <div style={{
                    minHeight: '100vh',
                    background: mobileBackground,
                    fontFamily: "'Inter', -apple-system, sans-serif",
                    color: '#0f172a',
                }}>
                    <header style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 120,
                        paddingTop: 'calc(var(--safe-area-top) + 12px)',
                        background: mobileHeaderBackground,
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        borderBottom: '1px solid rgba(226,232,240,0.85)',
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '12px 16px 14px',
                        }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: mobileAccentColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    {professionIcon} {professionLabel}
                                </div>
                                <h1 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 750, letterSpacing: '-0.03em', color: '#0f172a' }}>
                                    {mobileShell.activeTitle}
                                </h1>
                                <div style={{ fontSize: 12.5, color: mobileSubtitleColor, marginTop: 2 }}>
                                    {mobileShell.activeSubtitle || `${userName} • native mobile mode`}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                {tokenBalance !== undefined && (
                                    <button onClick={onWalletClick} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px',
                                        borderRadius: 999, background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                        color: 'white', fontSize: 12, fontWeight: 700, border: 'none',
                                        cursor: 'pointer', boxShadow: '0 6px 18px rgba(245,158,11,0.22)',
                                        position: 'relative',
                                    }}>
                                        🪙 {tokenBalance}
                                        {tokenBalance <= 10 && (
                                            <span className="wallet-low-indicator" style={{
                                                position: 'absolute', top: -1, right: -1, width: 8, height: 8,
                                                borderRadius: '50%', border: '2px solid white',
                                            }} />
                                        )}
                                    </button>
                                )}
                                {mobileShell.headerAction}
                            </div>
                        </div>
                    </header>

                    <main style={{
                        padding: '14px 14px calc(108px + var(--safe-area-bottom))',
                    }}>
                        {children}
                    </main>

                    <nav style={{
                        position: 'fixed',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 140,
                        padding: '10px 12px calc(var(--safe-area-bottom) + 10px)',
                        background: mobileNavBackground,
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        borderTop: '1px solid rgba(226,232,240,0.9)',
                        boxShadow: '0 -12px 30px rgba(15,23,42,0.08)',
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${mobileShell.tabs.length}, minmax(0, 1fr))`,
                            gap: 8,
                        }}>
                            {mobileShell.tabs.map(tab => {
                                const active = mobileShell.activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`mobile-tab-btn ${active ? 'active' : ''}`}
                                        onClick={() => mobileShell.onTabChange(tab.id)}
                                        aria-current={active ? 'page' : undefined}
                                    >
                                        <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
                                        <span style={{ fontSize: 11.5, fontWeight: active ? 700 : 600 }}>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{`
                .sidebar-nav-btn { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: none; background: transparent; color: rgba(255,255,255,0.7); border-radius: 10px; cursor: pointer; font-size: 14px; font-family: 'Inter', sans-serif; font-weight: 450; text-align: left; width: 100%; white-space: nowrap; transition: all 0.2s ease; letter-spacing: -0.01em; }
                .sidebar-nav-btn:hover { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.9); }
                .sidebar-nav-btn.active { background: rgba(99,102,241,0.15); color: #c7d2fe; font-weight: 550; }
                .sidebar-nav-btn.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 20px; background: #6366f1; border-radius: 0 3px 3px 0; }
                .sidebar-footer-btn { width: 100%; padding: 8px 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: 'Inter', sans-serif; font-weight: 450; text-align: left; transition: all 0.2s ease; display: flex; align-items: center; gap: 8px; }
                .sidebar-footer-btn:hover { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.9); }
                .sidebar-footer-btn.logout:hover { background: rgba(239,68,68,0.08); color: #f87171; border-color: rgba(239,68,68,0.15); }
                .topbar-search { padding: 8px 14px 8px 36px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-family: 'Inter', sans-serif; color: #475569; width: 240px; outline: none; transition: all 0.2s ease; background: #f8fafc; }
                .topbar-search:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.08); background: white; }
                .topbar-search::placeholder { color: #64748b; }
                @keyframes pulse-red { 0%, 100% { background: #ef4444; } 50% { background: #f87171; } }
                .wallet-low-indicator { animation: pulse-red 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>

            <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", background: '#f8fafc' }}>
                <aside style={{
                    position: 'fixed', top: 0, left: 0, height: '100vh', width: sidebarWidth,
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 40%, #1e293b 100%)',
                    color: 'white', display: 'flex', flexDirection: 'column', zIndex: 100,
                    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', overflowX: 'hidden',
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                }}>
                    <div style={{
                        padding: collapsed ? '20px 12px' : '20px 20px', display: 'flex', alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between', minHeight: 72,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        {!collapsed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img src="/logos/mytracksy-logo.png" alt="MyTracksy" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 }}>MyTracksy</div>
                                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' as const }}>SaaS Finance</div>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setCollapsed(!collapsed)} style={{
                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)',
                            color: 'rgba(255,255,255,0.7)', width: 28, height: 28, borderRadius: 7,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, transition: 'all 0.2s ease', flexShrink: 0,
                        }} title={collapsed ? 'Expand' : 'Collapse'}>
                            {collapsed ? '→' : '←'}
                        </button>
                    </div>

                    <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => onNavChange(item.id)}
                                className={`sidebar-nav-btn ${activeNav === item.id ? 'active' : ''}${item.locked ? ' locked' : ''}`}
                                style={{
                                    justifyContent: collapsed ? 'center' : 'flex-start',
                                    position: 'relative',
                                    opacity: item.locked ? 0.6 : 1,
                                }}
                                title={item.locked ? `${item.label} (${item.tierBadge || 'PRO'} required)` : item.label}>
                                <span style={{ fontSize: '1.15rem', flexShrink: 0, width: 24, textAlign: 'center' }}>
                                    {item.locked ? '🔒' : item.icon}
                                </span>
                                {!collapsed && (
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {item.label}
                                        {item.tierBadge && (
                                            <span style={{
                                                fontSize: 9,
                                                fontWeight: 800,
                                                padding: '1px 6px',
                                                borderRadius: 4,
                                                background: item.locked
                                                    ? 'linear-gradient(135deg, #f59e0b, #f97316)'
                                                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                                color: item.locked ? '#1e1b4b' : '#fff',
                                                letterSpacing: '0.05em',
                                                lineHeight: '14px',
                                                flexShrink: 0,
                                            }}>
                                                {item.tierBadge}
                                            </span>
                                        )}
                                    </span>
                                )}
                                {collapsed && item.tierBadge && (
                                    <span style={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        fontSize: 7,
                                        fontWeight: 800,
                                        padding: '0px 3px',
                                        borderRadius: 3,
                                        background: item.locked ? '#f59e0b' : '#6366f1',
                                        color: item.locked ? '#1e1b4b' : '#fff',
                                        lineHeight: '12px',
                                    }}>
                                        {item.tierBadge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>

                    <div style={{ padding: collapsed ? '12px 8px' : '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6, alignItems: collapsed ? 'center' : 'stretch' }}>
                        {!collapsed && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 4,
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                                }}>{userName.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{userName}</div>
                                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{professionLabel}</div>
                                </div>
                            </div>
                        )}
                        {collapsed ? (
                            <>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 4,
                                }} title={userName}>{userName.charAt(0).toUpperCase()}</div>
                                <button onClick={onChangeProfession} title="Change Profession" style={{
                                    width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, transition: 'all 0.2s ease',
                                }}>🔄</button>
                                <button onClick={onLogout} title="Sign Out" style={{
                                    width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, transition: 'all 0.2s ease',
                                }}>🚪</button>
                            </>
                        ) : (
                            <>
                                <button onClick={onChangeProfession} className="sidebar-footer-btn">
                                    <span>🔄</span> Change Profession
                                </button>
                                <button onClick={onLogout} className="sidebar-footer-btn logout">
                                    <span>🚪</span> Sign Out
                                </button>
                            </>
                        )}
                    </div>
                </aside>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: sidebarWidth, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
                    <header style={{
                        height: 64, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(226,232,240,0.8)', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
                        position: 'sticky', top: 0, zIndex: 50,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <h1 style={{ fontSize: 17, fontWeight: 650, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                                {activeNavItem?.icon}{' '}
                                {activeNavItem?.label}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
                                <input className="topbar-search" type="text" placeholder="Search..." />
                            </div>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10, background: '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', position: 'relative', fontSize: 16, transition: 'background 0.2s',
                            }}>🔔
                                <div style={{
                                    position: 'absolute', top: -2, right: -2, width: 8, height: 8,
                                    background: '#ef4444', borderRadius: '50%', border: '2px solid white',
                                }} />
                            </div>
                            {tokenBalance !== undefined && (
                                <button onClick={onWalletClick} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                                    borderRadius: 20, background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: 'white', fontSize: 12, fontWeight: 600, border: 'none',
                                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
                                    position: 'relative', transition: 'all 0.2s ease',
                                }}>
                                    🪙
                                    <span>{tokenBalance} tokens</span>
                                    {tokenBalance <= 10 && (
                                        <div className="wallet-low-indicator" style={{
                                            position: 'absolute', top: -2, right: -2, width: 8, height: 8,
                                            borderRadius: '50%', border: '2px solid white',
                                        }} />
                                    )}
                                </button>
                            )}
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 14px',
                                borderRadius: 20, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white', fontSize: 12, fontWeight: 600, letterSpacing: '0.01em',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
                            }}>
                                {professionIcon} {professionLabel}
                            </span>
                        </div>
                    </header>

                    <main style={{ flex: 1, padding: 24 }}>{children}</main>
                </div>
            </div>
        </>
    );
};

export default DashboardLayout;
