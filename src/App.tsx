import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SimpleLogin from './components/SimpleLogin';
import ProfessionSetup from './components/ProfessionSetup';
import ProfessionDashboard from './components/dashboards/ProfessionDashboard';
import { ProfessionType } from './contexts/AuthContext';
import './i18n';

type AppView = 'landing' | 'login' | 'profession' | 'dashboard';

function App() {
  const [view, setView] = useState<AppView>('landing');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType | null>(null);

  // Check for stored login on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('tracksyUser');
    const storedProfession = localStorage.getItem('myTracksyProfession');

    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      if (storedProfession) {
        try {
          const data = JSON.parse(storedProfession);
          if (data.profession) {
            setSelectedProfession(data.profession);
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
      // No stored user — show landing page
      setView('landing');
    }
  }, []);

  const handleLogin = (email: string, _password: string) => {
    const user = {
      email: email || 'user@tracksy.lk',
      name: 'Tracksy User',
      uid: Date.now().toString()
    };
    setCurrentUser(user);
    setLoginError('');
    setLoginLoading(false);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(user));
    } catch (error) {
      // Ignore
    }
    setView('profession');
  };

  const handleRegister = (email: string, _password: string) => {
    const user = {
      email: email || 'user@tracksy.lk',
      name: 'New User',
      uid: Date.now().toString()
    };
    setCurrentUser(user);
    setLoginError('');
    setLoginLoading(false);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(user));
    } catch (error) {
      // Ignore
    }
    setView('profession');
  };

  const handleSkipLogin = () => {
    const guestUser = { email: 'guest@tracksy.lk', name: 'Guest User', uid: 'guest' };
    setCurrentUser(guestUser);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(guestUser));
    } catch { }
    setView('profession');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedProfession(null);
    localStorage.removeItem('tracksyUser');
    localStorage.removeItem('myTracksyProfession');
    setView('landing');
  };

  const handleChangeProfession = () => {
    setSelectedProfession(null);
    localStorage.removeItem('myTracksyProfession');
    setView('profession');
  };

  // Demo: skip login, go straight to profession dashboard
  const handleDemoProfession = (profession: ProfessionType) => {
    const demoUser = { email: 'demo@tracksy.lk', name: 'Demo User', uid: 'demo-' + profession };
    setCurrentUser(demoUser);
    setSelectedProfession(profession);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(demoUser));
      localStorage.setItem('myTracksyProfession', JSON.stringify({ profession }));
    } catch { }
    setView('dashboard');
  };

  // ============ ROUTING ============

  // 0. Landing page (first visit)
  if (view === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setView('login')}
        onLogin={() => setView('login')}
        onDemoProfession={handleDemoProfession}
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
        onProfessionSelected={(profession) => {
          setSelectedProfession(profession);
          setView('dashboard');
        }}
      />
    );
  }

  // 3. Dashboard
  return (
    <ProfessionDashboard
      profession={selectedProfession!}
      userName={currentUser?.name || currentUser?.email || 'User'}
      onChangeProfession={handleChangeProfession}
      onLogout={handleLogout}
    />
  );
}

export default App;