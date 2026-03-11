import React, { useState } from 'react';
import { ProfessionType } from '../../contexts/AuthContext';

interface NavItem { id: string; label: string; icon: string; }

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
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    professionLabel, professionIcon, userName, navItems, activeNav,
    onNavChange, onChangeProfession, onLogout, children, tokenBalance, onWalletClick,
}) => {
    const [collapsed, setCollapsed] = useState(false);
    const w = collapsed ? 68 : 260;

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
                {/* Sidebar */}
                <aside style={{
                    position: 'fixed', top: 0, left: 0, height: '100vh', width: w,
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 40%, #1e293b 100%)',
                    color: 'white', display: 'flex', flexDirection: 'column', zIndex: 100,
                    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)', overflowX: 'hidden',
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                }}>
                    {/* Logo area */}
                    <div style={{
                        padding: collapsed ? '20px 12px' : '20px 20px', display: 'flex', alignItems: 'center',
                        justifyContent: collapsed ? 'center' : 'space-between', minHeight: 72,
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        {!collapsed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8,
                                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.9rem', boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                                }}>💰</div>
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

                    {/* Nav */}
                    <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
                        {navItems.map(item => (
                            <button key={item.id} onClick={() => onNavChange(item.id)}
                                className={`sidebar-nav-btn ${activeNav === item.id ? 'active' : ''}`}
                                style={{ justifyContent: collapsed ? 'center' : 'flex-start', position: 'relative' }}
                                title={item.label}>
                                <span style={{ fontSize: '1.15rem', flexShrink: 0, width: 24, textAlign: 'center' }}>{item.icon}</span>
                                {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                            </button>
                        ))}
                    </nav>

                    {/* Footer */}
                    {!collapsed && (
                        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {/* User badge */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                                background: 'rgba(255,255,255,0.04)', borderRadius: 10, marginBottom: 4,
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 14, fontWeight: 700, color: 'white',
                                }}>{userName.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{userName}</div>
                                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{professionLabel}</div>
                                </div>
                            </div>
                            <button onClick={onChangeProfession} className="sidebar-footer-btn">
                                <span>🔄</span> Change Profession
                            </button>
                            <button onClick={onLogout} className="sidebar-footer-btn logout">
                                <span>🚪</span> Sign Out
                            </button>
                        </div>
                    )}
                </aside>

                {/* Main */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: w, transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
                    {/* Top Bar */}
                    <header style={{
                        height: 64, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(226,232,240,0.8)', display: 'flex',
                        alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
                        position: 'sticky', top: 0, zIndex: 50,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <h1 style={{ fontSize: 17, fontWeight: 650, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                                {navItems.find(n => n.id === activeNav)?.icon}{' '}
                                {navItems.find(n => n.id === activeNav)?.label}
                            </h1>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            {/* Search */}
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#94a3b8' }}>🔍</span>
                                <input className="topbar-search" type="text" placeholder="Search..." />
                            </div>
                            {/* Notifications */}
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
                            {/* Wallet Balance */}
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
                            {/* Profession badge */}
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

                    {/* Content */}
                    <main style={{ flex: 1, padding: 24 }}>{children}</main>
                </div>
            </div>
        </>
    );
};

export default DashboardLayout;
