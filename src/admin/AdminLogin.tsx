/**
 * AdminLogin.tsx — Secure Admin Login Page
 */

interface AdminLoginProps {
    onLogin: (email: string, password: string) => void;
    error: string;
    isLoggedInButNotAdmin: boolean;
}

import { useState } from 'react';

export default function AdminLogin({ onLogin, error, isLoggedInButNotAdmin }: AdminLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const s: Record<string, React.CSSProperties> = {
        page: {
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '1rem',
        },
        card: {
            background: 'rgba(30, 27, 75, 0.8)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '1.5rem',
            padding: '2.5rem 2rem',
            maxWidth: '400px',
            width: '100%',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        },
        logo: { textAlign: 'center' as const, marginBottom: '1.5rem' },
        shield: { fontSize: '3rem', marginBottom: '0.5rem' },
        title: { color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 },
        subtitle: { color: '#94a3b8', fontSize: '0.85rem', margin: '0.25rem 0 0' },
        input: {
            width: '100%',
            padding: '0.75rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.75rem',
            color: '#fff',
            fontSize: '0.9rem',
            marginBottom: '0.75rem',
            outline: 'none',
            boxSizing: 'border-box' as const,
        },
        btn: {
            width: '100%',
            padding: '0.85rem',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: '0.5rem',
        },
        error: {
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#fca5a5',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            textAlign: 'center' as const,
        },
        denied: {
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize: '0.8rem',
            marginBottom: '1rem',
            textAlign: 'center' as const,
        },
    };

    return (
        <div style={s.page}>
            <div style={s.card}>
                <div style={s.logo}>
                    <img src="/logos/mytracksy-logo.png" alt="MyTracksy Logo" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 8 }} />
                    <h1 style={s.title}>MyTracksy Admin</h1>
                    <p style={s.subtitle}>Super Admin Dashboard</p>
                </div>

                {isLoggedInButNotAdmin && (
                    <div style={s.denied}>
                        ⚠️ Your account does not have admin privileges. Contact the system administrator.
                    </div>
                )}

                {error && <div style={s.error}>❌ {error}</div>}

                <form onSubmit={(e) => { e.preventDefault(); onLogin(email, password); }}>
                    <input
                        style={s.input}
                        type="email"
                        placeholder="Admin Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                    <input
                        style={s.input}
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                    <button type="submit" style={s.btn}>
                        🔐 Sign In to Admin
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#475569', fontSize: '0.7rem' }}>
                    🔒 Protected by Firebase Auth + Custom Claims<br />
                    PDPA Compliant — Zero Clinical Data Access
                </div>
            </div>
        </div>
    );
}
