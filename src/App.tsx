import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from './services/firebase';
import LandingPage from './components/LandingPage';
import ProfessionLandingPage from './components/ProfessionLandingPage';
import SimpleLogin from './components/SimpleLogin';
import ProfessionSetup from './components/ProfessionSetup';
import ProfessionDashboard from './components/dashboards/ProfessionDashboard';
import ManifestUpdater from './components/ManifestUpdater';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import NetworkStatusBar from './components/NetworkStatusBar';
import { ProfessionType } from './contexts/AuthContext';
import { getSlugFromPath, getRouteBySlug, getRouteByProfession } from './config/professionRoutes';
import './i18n';

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
          // Not logged in → show login, remember the profession
          setSelectedProfession(route.profession);
          setView('login');
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

  // 0. Landing page (first visit, root URL)
  if (view === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setView('login')}
        onLogin={() => setView('login')}
        onDemoProfession={handleDemoProfession}
        onProfessionPage={handleProfessionPage}
      />
    );
  }

  // 0.5 Profession-specific landing page (SaaS style)
  if (view === 'professionLanding' && professionLandingSlug) {
    return (
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
    );
  }

  // 1. Login / Register page
  if (view === 'login') {
    return (
      <SimpleLogin
        onLogin={handleLogin}
        onRegister={handleRegister}
        onSkipLogin={handleSkipLogin}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  // 2. Profession selection
  if (view === 'profession') {
    return (
      <ProfessionSetup
        onProfessionSelected={handleProfessionSelected}
      />
    );
  }

  // 3. Dashboard with PWA support
  return (
    <>
      <NetworkStatusBar />
      <ManifestUpdater profession={selectedProfession} />
      <ProfessionDashboard
        profession={selectedProfession!}
        userName={currentUser?.name || currentUser?.email || 'User'}
        onChangeProfession={handleChangeProfession}
        onLogout={handleLogout}
      />
      {selectedProfession && <PWAInstallPrompt profession={selectedProfession} />}
    </>
  );
}

export default App;