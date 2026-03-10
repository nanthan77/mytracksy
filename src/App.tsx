import { useState, useEffect } from 'react';
import SimpleLogin from './components/SimpleLogin';
import ProfessionSetup from './components/ProfessionSetup';
import ProfessionDashboard from './components/dashboards/ProfessionDashboard';
import { ProfessionType } from './contexts/AuthContext';
import './i18n';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [selectedProfession, setSelectedProfession] = useState<ProfessionType | null>(null);

  // Check for stored login or auto-login
  useEffect(() => {
    const storedUser = localStorage.getItem('tracksyUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    } else {
      // Auto-login after 2 seconds if no stored user
      setTimeout(() => {
        if (!isLoggedIn) {
          const autoUser = {
            email: 'demo@tracksy.lk',
            name: 'Demo User',
            uid: 'auto-' + Date.now()
          };
          setCurrentUser(autoUser);
          setIsLoggedIn(true);
          try {
            localStorage.setItem('tracksyUser', JSON.stringify(autoUser));
          } catch (error) {
            // Ignore errors
          }
        }
      }, 2000);
    }
  }, [isLoggedIn]);

  // Check for stored profession on mount
  useEffect(() => {
    const stored = localStorage.getItem('myTracksyProfession');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.profession) {
          setSelectedProfession(data.profession);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleLogin = (email: string, _password: string) => {
    const user = {
      email: email || 'user@tracksy.lk',
      name: 'Tracksy User',
      uid: Date.now().toString()
    };
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginError('');
    setLoginLoading(false);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(user));
    } catch (error) {
      // Ignore
    }
  };

  const handleRegister = (email: string, _password: string) => {
    const user = {
      email: email || 'user@tracksy.lk',
      name: 'New User',
      uid: Date.now().toString()
    };
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginError('');
    setLoginLoading(false);
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(user));
    } catch (error) {
      // Ignore
    }
  };

  const handleSkipLogin = () => {
    const guestUser = { email: 'guest@tracksy.lk', name: 'Guest User', uid: 'guest' };
    setCurrentUser(guestUser);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedProfession(null);
    localStorage.removeItem('tracksyUser');
    localStorage.removeItem('myTracksyProfession');
  };

  const handleChangeProfession = () => {
    setSelectedProfession(null);
    localStorage.removeItem('myTracksyProfession');
  };

  // 1. Show login page if not logged in
  if (!isLoggedIn) {
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

  // 2. Show profession selection if logged in but no profession selected
  if (!selectedProfession) {
    return (
      <ProfessionSetup
        onProfessionSelected={(profession) => {
          setSelectedProfession(profession);
        }}
      />
    );
  }

  // 3. Show profession-specific dashboard
  return (
    <ProfessionDashboard
      profession={selectedProfession}
      userName={currentUser?.name || currentUser?.email || 'User'}
      onChangeProfession={handleChangeProfession}
      onLogout={handleLogout}
    />
  );
}

export default App;