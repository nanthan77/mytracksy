import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, sendPasswordResetEmail, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { ProfessionType } from './types/profession';
import { getSlugFromPath, getRouteBySlug, getRouteByProfession } from './config/professionRoutes';
import { seedChartOfAccounts } from './services/accountingCoreService';
import './i18n';

// ============ LAZY-LOADED COMPONENTS (Code Splitting) ============
// Each route loads its own chunk — reduces initial bundle by ~60-70%
const LandingPage = lazy(() => import('./components/LandingPage'));
const ProfessionLandingPage = lazy(() => import('./components/ProfessionLandingPage'));
const SimpleLogin = lazy(() => import('./components/SimpleLogin'));
const ProfessionSetup = lazy(() => import('./components/ProfessionSetup'));
const ProfessionDashboard = lazy(() => import('./components/dashboards/ProfessionDashboard'));
const ManifestUpdater = lazy(() => import('./components/ManifestUpdater'));
const PWAInstallPrompt = lazy(() => import('./components/PWAInstallPrompt'));
const NetworkStatusBar = lazy(() => import('./components/NetworkStatusBar'));

// Lightweight loading spinner (inline, not lazy-loaded)
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.2)',
          borderTopColor: '#00bfa5',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span style={{ color: '#fff', fontSize: '14px', opacity: 0.8 }}>Loading MyTracksy...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#0f172a', fontFamily: 'system-ui, sans-serif',
        }}>
          <div style={{ textAlign: 'center', color: '#f8fafc', maxWidth: 420, padding: '2rem' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Something went wrong</h1>
            <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
              MyTracksy encountered an error loading this page. Please try refreshing.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 28px', background: '#6366f1', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

type AppView = 'landing' | 'professionLanding' | 'login' | 'profession' | 'dashboard';

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false); // Firebase auth confirmed
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType | null>(null);
  const [professionLandingSlug, setProfessionLandingSlug] = useState<string | null>(null);

  // ============ URL-BASED ROUTING ============

  /** Navigate to profession URL */
  const navigateToProfession = (profession: ProfessionType) => {
    const route = getRouteByProfession(profession);
    if (route) {
      window.history.pushState({}, '', `/${route.slug}`);
    }
  };

  /** Navigate to root */
  const navigateToRoot = () => {
    window.history.pushState({}, '', '/');
  };

  /** Normalize current path for lightweight route checks */
  const getCurrentPath = () => {
    const normalizedPath = window.location.pathname.replace(/\/+$/, '');
    return normalizedPath || '/';
  };

  const bootstrapFirebaseUser = useCallback(async (
    user: { uid: string; email?: string; name?: string; photoURL?: string | null },
    professionOverride?: ProfessionType | null
  ) => {
    if (!user?.uid || user.uid.startsWith('guest_') || user.uid.startsWith('demo_')) return;

    const profession = professionOverride || selectedProfession || null;
    const userRef = doc(db, 'users', user.uid);
    const existing = await getDoc(userRef);

    const baseProfile: Record<string, unknown> = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.name || user.email?.split('@')[0] || 'User',
      photoURL: user.photoURL || null,
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    };

    if (!existing.exists()) {
      baseProfile.createdAt = serverTimestamp();
      baseProfile.chart_seeded = false;
    }

    if (profession) {
      baseProfile.profession = profession;
      baseProfile.app_type = profession;
    }

    await setDoc(userRef, baseProfile, { merge: true });

    if (profession) {
      await seedChartOfAccounts(user.uid, profession);
    }
  }, [selectedProfession]);

  // Check URL path + stored login on mount
  // Handle Google redirect result (for mobile/popup-blocked browsers)
  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        const user = {
          email: result.user.email || '',
          name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
          uid: result.user.uid
        };
        setCurrentUser(user);
        localStorage.setItem('tracksyUser', JSON.stringify(user));
        const storedProfession = localStorage.getItem('myTracksyProfession');
        if (storedProfession) {
          try {
            const data = JSON.parse(storedProfession);
            if (data.profession) {
              bootstrapFirebaseUser(user, data.profession).catch((error) => {
                console.error('Failed to bootstrap redirected user:', error);
              });
              setSelectedProfession(data.profession);
              navigateToProfession(data.profession);
              setView('dashboard');
              return;
            }
          } catch {}
        }
        bootstrapFirebaseUser(user, null).catch((error) => {
          console.error('Failed to bootstrap redirected user:', error);
        });
        navigateToRoot();
        setView('profession');
      }
    }).catch(() => {});
  }, [bootstrapFirebaseUser]);

  // ============ FIREBASE AUTH STATE LISTENER ============
  // Security fix: Use onAuthStateChanged as the authoritative auth source.
  // localStorage is only used for profession preference (non-sensitive).
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const slug = getSlugFromPath();
      const storedProfession = localStorage.getItem('myTracksyProfession');
      const currentPath = getCurrentPath();
      let persistedProfession: ProfessionType | null = null;

      if (storedProfession) {
        try {
          const data = JSON.parse(storedProfession);
          if (data.profession) {
            persistedProfession = data.profession;
            setSelectedProfession(data.profession);
          }
        } catch {
          persistedProfession = null;
        }
      }

      if (firebaseUser) {
        // Firebase confirms a valid session — trust this user
        const user = {
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          uid: firebaseUser.uid,
          photoURL: firebaseUser.photoURL || null,
        };
        setCurrentUser(user);
        localStorage.setItem('tracksyUser', JSON.stringify(user));

        if (slug) {
          const route = getRouteBySlug(slug);
          if (route) {
            setSelectedProfession(route.profession);
            setView('dashboard');
            setAuthReady(true);
            return;
          }
        }

        if (persistedProfession) {
          navigateToProfession(persistedProfession);
          setView('dashboard');
        } else {
          if (currentPath === '/login') {
            navigateToRoot();
          }
          setView('profession');
        }
      } else {
        // No Firebase session — user is not authenticated
        setCurrentUser(null);
        localStorage.removeItem('tracksyUser');

        if (slug) {
          const route = getRouteBySlug(slug);
          if (route) {
            setProfessionLandingSlug(slug);
            setView('professionLanding');
            setAuthReady(true);
            return;
          }
        }

        if (currentPath === '/login') {
          setProfessionLandingSlug(null);
          setView('login');
        } else {
          setView('landing');
        }
      }

      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !selectedProfession) return;
    bootstrapFirebaseUser(currentUser, selectedProfession).catch((error) => {
      console.error('Failed to sync user bootstrap state:', error);
    });
  }, [bootstrapFirebaseUser, currentUser, selectedProfession]);

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const hasPersistentUser = Boolean(currentUser && !currentUser.uid.startsWith('guest_'));
      const currentPath = getCurrentPath();

      if (currentPath === '/login') {
        setProfessionLandingSlug(null);
        setView(hasPersistentUser ? (selectedProfession ? 'dashboard' : 'profession') : 'login');
        return;
      }

      const slug = getSlugFromPath();
      if (slug) {
        const route = getRouteBySlug(slug);
        if (route) {
          if (hasPersistentUser) {
            setSelectedProfession(route.profession);
            setView('dashboard');
          } else {
            setProfessionLandingSlug(slug);
            setView('professionLanding');
          }
        }
      } else {
        if (!hasPersistentUser) {
          setCurrentUser(null);
          setSelectedProfession(null);
          setView('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser, selectedProfession]);

  // ============ AUTH HANDLERS ============

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = {
        email: result.user.email || email,
        name: result.user.displayName || email.split('@')[0],
        uid: result.user.uid,
        photoURL: result.user.photoURL || null,
      };
      setCurrentUser(user);
      localStorage.setItem('tracksyUser', JSON.stringify(user));
      await bootstrapFirebaseUser(user, selectedProfession);
      if (selectedProfession) {
        localStorage.setItem('myTracksyProfession', JSON.stringify({ profession: selectedProfession }));
        navigateToProfession(selectedProfession);
        setView('dashboard');
      } else {
        navigateToRoot();
        setView('profession');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = {
        email: result.user.email || email,
        name: result.user.displayName || email.split('@')[0],
        uid: result.user.uid,
        photoURL: result.user.photoURL || null,
      };
      setCurrentUser(user);
      localStorage.setItem('tracksyUser', JSON.stringify(user));
      await bootstrapFirebaseUser(user, selectedProfession);
      if (selectedProfession) {
        localStorage.setItem('myTracksyProfession', JSON.stringify({ profession: selectedProfession }));
        navigateToProfession(selectedProfession);
        setView('dashboard');
      } else {
        navigateToRoot();
        setView('profession');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Registration failed');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = {
        email: result.user.email || '',
        name: result.user.displayName || result.user.email?.split('@')[0] || 'User',
        uid: result.user.uid,
        photoURL: result.user.photoURL || null,
      };
      setCurrentUser(user);
      localStorage.setItem('tracksyUser', JSON.stringify(user));
      await bootstrapFirebaseUser(user, selectedProfession);
      if (selectedProfession) {
        localStorage.setItem('myTracksyProfession', JSON.stringify({ profession: selectedProfession }));
        navigateToProfession(selectedProfession);
        setView('dashboard');
      } else {
        navigateToRoot();
        setView('profession');
      }
    } catch (error: any) {
      // Popup blocked or failed — fall back to redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request') {
        try {
          const provider = new GoogleAuthProvider();
          await signInWithRedirect(auth, provider);
          return; // Page will redirect, don't setLoginLoading(false)
        } catch {
          setLoginError('Google sign-in failed. Please try again.');
        }
      } else if (error.code !== 'auth/popup-closed-by-user') {
        setLoginError(error.message || 'Google sign-in failed');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    setLoginError('');
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      setLoginError(error.message || 'Failed to send reset email');
      throw error;
    }
  };

  const handleSkipLogin = () => {
    const guestUser = { email: 'guest@tracksy.lk', name: 'Guest User', uid: 'guest_' + Date.now() };
    setCurrentUser(guestUser);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(guestUser));
    } catch { }

    if (selectedProfession) {
      localStorage.setItem('myTracksyProfession', JSON.stringify({ profession: selectedProfession }));
      navigateToProfession(selectedProfession);
      setView('dashboard');
    } else {
      navigateToRoot();
      setView('profession');
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Firebase sign-out failed:', error);
    }
    setCurrentUser(null);
    setSelectedProfession(null);
    localStorage.removeItem('tracksyUser');
    localStorage.removeItem('myTracksyProfession');
    navigateToRoot();
    setView('landing');
  };

  // ============ IDLE TIMEOUT — 30 min auto-logout ============
  useEffect(() => {
    if (!currentUser) return;

    const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        console.warn('[Security] Idle timeout reached — auto-logging out');
        handleLogout();
      }, IDLE_TIMEOUT_MS);
    };

    // Track user activity
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));

    // Start the timer
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach((evt) => window.removeEventListener(evt, resetIdleTimer));
    };
  }, [currentUser]);

  const handleChangeProfession = () => {
    setSelectedProfession(null);
    localStorage.removeItem('myTracksyProfession');
    navigateToRoot();
    setView('profession');
  };

  const handleProfessionSelected = (profession: ProfessionType) => {
    setSelectedProfession(profession);
    localStorage.setItem('myTracksyProfession', JSON.stringify({ profession }));
    if (currentUser && !currentUser.uid.startsWith('guest_') && !currentUser.uid.startsWith('demo_')) {
      bootstrapFirebaseUser(currentUser, profession).catch((error) => {
        console.error('Failed to save selected profession:', error);
      });
    }
    navigateToProfession(profession);
    setView('dashboard');
  };

  // Demo: skip login, go straight to profession dashboard
  const handleDemoProfession = (profession: ProfessionType) => {
    const demoUser = { email: 'demo@tracksy.lk', name: 'Demo User', uid: 'demo_' + Date.now() };
    setCurrentUser(demoUser);
    setSelectedProfession(profession);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(demoUser));
      localStorage.setItem('myTracksyProfession', JSON.stringify({ profession }));
    } catch { }
    navigateToProfession(profession);
    setView('dashboard');
  };

  // ============ ROUTING ============

  // Handle profession tile click → show profession landing page
  const handleProfessionPage = (slug: string) => {
    window.history.pushState({}, '', `/${slug}`);
    setProfessionLandingSlug(slug);
    setView('professionLanding');
  };

  // ============ ROUTING WITH SUSPENSE ============

  const handleBackFromLogin = () => {
    setLoginError('');
    if (selectedProfession) {
      const route = getRouteByProfession(selectedProfession);
      if (route) {
        window.history.pushState({}, '', `/${route.slug}`);
        setProfessionLandingSlug(route.slug);
        setView('professionLanding');
        return;
      }
    }
    navigateToRoot();
    setProfessionLandingSlug(null);
    setView('landing');
  };

  // ============ AUTH GATE ============
  // Wait for Firebase to confirm auth state before rendering any view.
  // This prevents the flash-of-wrong-content and localStorage auth bypass.
  if (!authReady) {
    return <LoadingFallback />;
  }

  // 0. Landing page (first visit, root URL)
  if (view === 'landing') {
    return (
      <ErrorBoundary><Suspense fallback={<LoadingFallback />}>
        <LandingPage
          onGetStarted={() => {
            window.history.pushState({}, '', '/login');
            setSelectedProfession(null);
            setProfessionLandingSlug(null);
            setView('login');
          }}
          onLogin={() => {
            window.history.pushState({}, '', '/login');
            setSelectedProfession(null);
            setProfessionLandingSlug(null);
            setView('login');
          }}
          onDemoProfession={handleDemoProfession}
          onProfessionPage={handleProfessionPage}
        />
      </Suspense></ErrorBoundary>
    );
  }

  // 0.5 Profession-specific landing page (SaaS style)
  if (view === 'professionLanding' && professionLandingSlug) {
    const route = getRouteBySlug(professionLandingSlug);
    const landingProfession = route ? route.profession : null;

    return (
      <ErrorBoundary><Suspense fallback={<LoadingFallback />}>
        {landingProfession && <ManifestUpdater profession={landingProfession} />}
        <ProfessionLandingPage
          slug={professionLandingSlug}
          onGetStarted={() => {
            if (route) {
              setSelectedProfession(route.profession);
            }
            window.history.pushState({}, '', '/login');
            setView('login');
          }}
          onLogin={() => {
            if (route) {
              setSelectedProfession(route.profession);
            }
            window.history.pushState({}, '', '/login');
            setView('login');
          }}
          onBack={() => {
            window.history.pushState({}, '', '/');
            setProfessionLandingSlug(null);
            setView('landing');
          }}
        />
        {landingProfession && route?.dedicatedPwa && <PWAInstallPrompt profession={landingProfession} />}
      </Suspense></ErrorBoundary>
    );
  }

  // 1. Login / Register page
  if (view === 'login') {
    return (
      <ErrorBoundary><Suspense fallback={<LoadingFallback />}>
        <SimpleLogin
          onLogin={handleLogin}
          onRegister={handleRegister}
          onGoogleSignIn={handleGoogleSignIn}
          onForgotPassword={handleForgotPassword}
          onSkipLogin={handleSkipLogin}
          onBack={handleBackFromLogin}
          contextLabel={selectedProfession ? getRouteByProfession(selectedProfession)?.name : undefined}
          loading={loginLoading}
          error={loginError}
        />
      </Suspense></ErrorBoundary>
    );
  }

  // 2. Profession selection
  if (view === 'profession') {
    return (
      <ErrorBoundary><Suspense fallback={<LoadingFallback />}>
        <ProfessionSetup
          onProfessionSelected={handleProfessionSelected}
          onBackToHome={() => {
            handleLogout();
            setView('landing');
          }}
        />
      </Suspense></ErrorBoundary>
    );
  }

  // 3. Dashboard with PWA support
  const selectedRoute = selectedProfession ? getRouteByProfession(selectedProfession) : undefined;
  return (
    <ErrorBoundary><Suspense fallback={<LoadingFallback />}>
      <NetworkStatusBar />
      <ManifestUpdater profession={selectedProfession} />
      <ProfessionDashboard
        profession={selectedProfession!}
        userName={currentUser?.name || currentUser?.email || 'User'}
        onChangeProfession={handleChangeProfession}
        onLogout={handleLogout}
      />
      {selectedProfession && selectedRoute?.dedicatedPwa && <PWAInstallPrompt profession={selectedProfession} layoutContext="dashboard" />}
    </Suspense></ErrorBoundary>
  );
}

export default App;
