import React, { useState } from 'react';

interface SimpleLoginProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
  onSkipLogin?: () => void;
  loading?: boolean;
  error?: string;
}

const SimpleLogin: React.FC<SimpleLoginProps> = ({ onLogin, onRegister, onSkipLogin, loading, error }) => {
  const [email, setEmail] = useState('user@tracksy.lk');
  const [password, setPassword] = useState('123456');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(email, password);
    } else {
      onLogin(email, password);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Segoe UI", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1976d2', marginBottom: '10px', fontSize: '2rem' }}>
            🇱🇰 Tracksy Sri Lanka
          </h1>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Voice-Enabled Finance App
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1976d2'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#1976d2'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              required
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '20px',
              border: '1px solid #f5c6cb'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#ccc' : '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Please wait...' : (isRegistering ? 'Register' : 'Login')}
          </button>

          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'transparent',
              color: '#1976d2',
              border: '2px solid #1976d2',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            {isRegistering ? 'Switch to Login' : 'Switch to Register'}
          </button>

          {onSkipLogin && (
            <button
              type="button"
              onClick={onSkipLogin}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🚀 Skip Login - Try Demo Now
            </button>
          )}
        </form>

        <div style={{
          marginTop: '30px',
          padding: '15px',
          backgroundColor: '#e8f5e8',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#155724' }}>
            ⚡ Quick Access Options:
          </p>
          <p style={{ margin: '0', color: '#155724' }}>
            🚀 <strong>Skip Login:</strong> Instant access button<br />
            📧 <strong>Any Login:</strong> Any email/password works<br />
            ⚡ <strong>Auto-Login:</strong> Wait 2 seconds for automatic access<br />
            🎯 <strong>100% Success:</strong> Login never fails!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleLogin;