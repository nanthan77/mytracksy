import { useState, useEffect, lazy, Suspense } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './services/firebase';
import { ProfessionType } from './contexts/AuthContext';
import { getSlugFromPath, getRouteBySlug, getRouteByProfession } from './config/professionRoutes';
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

type AppView = 'landing' | 'professionLanding' | 'login' | 'profession' | 'dashboard';

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);
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

  // Check URL path + stored login on mount
  useEffect(() => {
    const slug = getSlugFromPath();
    const storedUser = localStorage.getItem('tracksyUser');
    const storedProfession = localStorage.getItem('myTracksyProfession');

    if (slug) {
      // URL has a profession slug (e.g., /dr, /lawyer)
      const route = getRouteBySlug(slug);
      if (route) {
        if (storedUser) {
          // Logged in → go straight to dashboard
          setCurrentUser(JSON.parse(storedUser));
          setSelectedProfession(route.profession);
          setView('dashboard');
        } else {
          // Not logged in → show profession landing page
          setProfessionLandingSlug(slug);
          setView('professionLanding');
        }
        return;
      }
    }

    // No profession slug → normal flow
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      if (storedProfession) {
        try {
          const data = JSON.parse(storedProfession);
          if (data.profession) {
            setSelectedProfession(data.profession);
            navigateToProfession(data.profession);
            setView('dashboard');
          } else {
            setView('profession');
          }
        } catch {
          setView('profession');
        }
      } else {
        setView('profession');
      }
    } else {
      setView('landing');
    }
  }, []);

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const slug = getSlugFromPath();
      if (slug) {
        const route = getRouteBySlug(slug);
        if (route && currentUser) {
          setSelectedProfession(route.profession);
          setView('dashboard');
        }
      } else {
        if (!currentUser) {
          setView('landing');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentUser]);

  // ============ AUTH HANDLERS ============

  const handleLogin = async (email: string, password: string) => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = {
        email: result.user.email || email,
        name: result.user.displayName || email.split('@')[0],
        uid: result.user.uid
      };
      setCurrentUser(user);
      localStorage.setItem('tracksyUser', JSON.stringify(user));
      if (selectedProfession) {
        localStorage.setItem('myTracksyProfession', JSON.stringify({ profession: selectedProfession }));
        navigateToProfession(selectedProfession);
        setView('dashboard');
      } else {
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
        uid: result.user.uid
      };
      setCurrentUser(user);
      localStorage.setItem('tracksyUser', JSON.stringify(user));
      if (selectedProfession) {
        localStorage.setItem('myTracksyProfession', JSON.stringify({ profession: selectedProfession }));
        navigateToProfession(selectedProfession);
        setView('dashboard');
      } else {
        setView('profession');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Registration failed');
    } finally {
      setLoginLoading(false);
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
      setView('profession');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProfession(null);
    localStorage.removeItem('tracksyUser');
    localStorage.removeItem('myTracksyProfession');
    navigateToRoot();
    setView('landing');
  };

  const handleChangeProfession = () => {
    setSelectedProfession(null);
    localStorage.removeItem('myTracksyProfession');
    navigateToRoot();
    setView('profession');
  };

  const handleProfessionSelected = (profession: ProfessionType) => {
    setSelectedProfession(profession);
    localStorage.setItem('myTracksyProfession', JSON.stringify({ profession }));
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
    setProfessionLandingSlug(slug);
    setView('professionLanding');
  };

  // ============ ROUTING WITH SUSPENSE ============

  // 0. Landing page (first visit, root URL)
  if (view === 'landing') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LandingPage
          onGetStarted={() => setView('login')}
          onLogin={() => setView('login')}
          onDemoProfession={handleDemoProfession}
          onProfessionPage={handleProfessionPage}
        />
      </Suspense>
    );
  }

  // 0.5 Profession-specific landing page (SaaS style)
  if (view === 'professionLanding' && professionLandingSlug) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProfessionLandingPage
          slug={professionLandingSlug}
          onGetStarted={() => {
            const route = getRouteBySlug(professionLandingSlug);
            if (route) {
              setSelectedProfession(route.profession);
            }
            setView('login');
          }}
          onLogin={() => setView('login')}
          onBack={() => {
            setProfessionLandingSlug(null);
            setView('landing');
          }}
        />
      </Suspense>
    );
  }

  // 1. Login / Register page
  if (view === 'login') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <SimpleLogin
          onLogin={handleLogin}
          onRegister={handleRegister}
          onSkipLogin={handleSkipLogin}
          loading={loginLoading}
          error={loginError}
        />
      </Suspense>
    );
  }

  // 2. Profession selection
  if (view === 'profession') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProfessionSetup
          onProfessionSelected={handleProfessionSelected}
          onBackToHome={() => {
            handleLogout();
            setView('landing');
          }}
        />
      </Suspense>
    );
  }

  // 3. Dashboard with PWA support
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NetworkStatusBar />
      <ManifestUpdater profession={selectedProfession} />
      <ProfessionDashboard
        profession={selectedProfession!}
        userName={currentUser?.name || currentUser?.email || 'User'}
        onChangeProfession={handleChangeProfession}
        onLogout={handleLogout}
      />
      {selectedProfession && <PWAInstallPrompt profession={selectedProfession} />}
    </Suspense>
  );
}

export default App;