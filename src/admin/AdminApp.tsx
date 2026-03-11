/**
 * AdminApp.tsx — Main Admin Panel Router
 *
 * Detects /admin path, verifies admin role, renders admin layout.
 * PDPA: Zero-knowledge — never accesses clinical data.
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';

export default function AdminApp() {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // 1. Founder UID bypass (hardcoded)
                const FOUNDER_UIDS = ['eyuHN6ZeYZgi2fSBM3bmslfzAhX2'];
                if (FOUNDER_UIDS.includes(firebaseUser.uid)) {
                    setIsAdmin(true);
                    setLoading(false);
                    return;
                }

                // 2. Check admin custom claim
                const token = await firebaseUser.getIdTokenResult(true);
                if (token.claims.admin === true) {
                    setIsAdmin(true);
                } else {
                    // 3. Fallback: check Firestore admin list
                    try {
                        const adminDoc = await getDoc(doc(db, 'system_settings', 'admin_users'));
                        if (adminDoc.exists()) {
                            const uids: string[] = adminDoc.data()?.uids || [];
                            setIsAdmin(uids.includes(firebaseUser.uid));
                        }
                    } catch (e) {
                        console.warn('Admin check fallback error:', e);
                    }
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleLogin = async (email: string, password: string) => {
        setLoginError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setLoginError(err.message || 'Login failed');
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setIsAdmin(false);
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a5b4fc',
                fontFamily: "'Inter', system-ui, sans-serif",
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
                    <div style={{ fontSize: '1rem' }}>Verifying admin access...</div>
                </div>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <AdminLogin onLogin={handleLogin} error={loginError} isLoggedInButNotAdmin={!!user && !isAdmin} />;
    }

    return <AdminLayout user={user} onLogout={handleLogout} />;
}
