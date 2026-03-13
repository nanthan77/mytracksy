import React, { useState, useEffect } from 'react';

interface SimpleLoginProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string) => void;
  onGoogleSignIn?: () => void;
  onForgotPassword?: (email: string) => Promise<void> | void;
  onSkipLogin?: () => void;
  onBack?: () => void;
  contextLabel?: string;
  loading?: boolean;
  error?: string;
}

type LegalDoc = 'terms' | 'privacy' | null;

const LEGAL_COPY: Record<Exclude<LegalDoc, null>, { title: string; summary: string[] }> = {
  terms: {
    title: 'Terms of Use',
    summary: [
      'MyTracksy provides finance and workflow tools for Sri Lankan professionals and businesses.',
      'You are responsible for the accuracy of the financial data, invoices, and operational records you enter.',
      'Subscription, tax, and payment workflows may depend on third-party providers and local regulatory changes.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    summary: [
      'MyTracksy is designed around privacy-first handling and Firebase-secured app infrastructure.',
      'Profession and usage data may be stored to provide dashboards, subscriptions, reminders, and AI workflows.',
      'Users remain responsible for managing any regulated personal or client data they upload into the platform.',
    ],
  },
};

const SimpleLogin: React.FC<SimpleLoginProps> = ({
  onLogin, onRegister, onGoogleSignIn, onForgotPassword, onSkipLogin, onBack, contextLabel, loading, error,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [localMessage, setLocalMessage] = useState('');
  const [localMessageTone, setLocalMessageTone] = useState<'error' | 'success'>('error');
  const [legalDoc, setLegalDoc] = useState<LegalDoc>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (error) {
      setLocalMessage('');
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage('');
    if (isRegistering) onRegister(email, password);
    else onLogin(email, password);
  };

  const handleForgotPassword = async () => {
    if (!onForgotPassword) return;
    if (!email.trim()) {
      setResetSent(false);
      setLocalMessageTone('error');
      setLocalMessage('Enter your email first, then request the reset link.');
      return;
    }

    try {
      await onForgotPassword(email.trim());
      setLocalMessageTone('success');
      setLocalMessage('Password reset email sent. Check your inbox.');
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch {
      setResetSent(false);
    }
  };

  const message = localMessage || error;
  const legalContent = legalDoc ? LEGAL_COPY[legalDoc] : null;

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes float { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-20px) rotate(2deg); } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .login-input { width: 100%; padding: 14px 16px; border: 1.5px solid rgba(255,255,255,0.12); border-radius: 10px; font-size: 15px; font-family: 'Inter', sans-serif; font-weight: 400; color: #fff; background: rgba(255,255,255,0.06); outline: none; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); backdrop-filter: blur(4px); box-sizing: border-box; }
        .login-input::placeholder { color: rgba(255,255,255,0.35); font-weight: 400; }
        .login-input:focus { border-color: rgba(99,102,241,0.7); background: rgba(255,255,255,0.09); box-shadow: 0 0 0 3px rgba(99,102,241,0.15), 0 0 20px rgba(99,102,241,0.08); }
        .login-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-size: 15px; font-family: 'Inter', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); letter-spacing: 0.01em; }
        .login-btn:active { transform: scale(0.98); }
        .login-btn-primary { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); color: white; box-shadow: 0 4px 15px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.1); background-size: 200% 200%; }
        .login-btn-primary:hover { box-shadow: 0 8px 25px rgba(99,102,241,0.45), 0 2px 6px rgba(0,0,0,0.15); transform: translateY(-1px); background-position: 100% 50%; }
        .login-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .login-btn-outline { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); border: 1.5px solid rgba(255,255,255,0.15); backdrop-filter: blur(4px); }
        .login-btn-outline:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); color: white; }
        .login-btn-google { background: rgba(255,255,255,0.95); color: #1f2937; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .login-btn-google:hover { background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .login-link { color: rgba(165,180,252,0.9); cursor: pointer; font-weight: 500; font-size: 14px; transition: color 0.2s; border: none; background: none; font-family: 'Inter', sans-serif; }
        .login-link:hover { color: #a5b4fc; text-decoration: underline; }
        .login-modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.72); backdrop-filter: blur(8px); z-index: 20; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .login-modal { width: min(560px, 100%); border-radius: 20px; background: rgba(15,23,42,0.96); border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 24px 60px rgba(0,0,0,0.42); color: white; }
      `}</style>

      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29 0%, #1a1145 30%, #24243e 60%, #0f172a 100%)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Animated background orbs */}
        {[
          { w: 400, h: 400, t: -100, l: -100, bg: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', d: '8s' },
          { w: 350, h: 350, t: '60%', l: '70%', bg: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', d: '10s' },
          { w: 250, h: 250, t: '30%', l: '80%', bg: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', d: '12s' },
        ].map((orb, i) => (
          <div key={i} style={{
            position: 'absolute', width: orb.w, height: orb.h, top: orb.t, left: orb.l,
            background: orb.bg, borderRadius: '50%', filter: 'blur(60px)',
            animation: `float ${orb.d} ease-in-out infinite`, pointerEvents: 'none',
          }} />
        ))}

        {/* Subtle grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Login Card */}
        <div style={{
          width: '100%', maxWidth: 420, padding: '2.5rem',
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20, position: 'relative', zIndex: 2,
          boxShadow: '0 25px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05) inset',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="login-link"
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.78)',
                textDecoration: 'none',
              }}
            >
              ← Back
            </button>
          )}

          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src="/logos/mytracksy-logo.png" alt="MyTracksy" style={{ height: 72, objectFit: 'contain', marginBottom: 8 }} />
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0, fontWeight: 400 }}>
              {contextLabel ? `${contextLabel} sign-in and onboarding` : 'Professional finance management for Sri Lanka'}
            </p>
          </div>

          {/* Toggle */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10,
            padding: 3, marginBottom: '1.75rem', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            {['Sign In', 'Register'].map((tab, i) => {
              const active = (i === 0 && !isRegistering) || (i === 1 && isRegistering);
              return (
                <button key={tab} onClick={() => setIsRegistering(i === 1)} style={{
                  flex: 1, padding: '9px 0', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500,
                  fontFamily: "'Inter', sans-serif", cursor: 'pointer', transition: 'all 0.25s ease',
                  background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                  color: active ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                }}>{tab}</button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                Email address
              </label>
              <input className="login-input" type="email" value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (localMessageTone === 'error') setLocalMessage('');
                }} placeholder="you@company.lk" required />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>
                  Password
                </label>
                {!isRegistering && onForgotPassword && (
                  <button type="button" className="login-link" style={{ fontSize: 12 }} onClick={handleForgotPassword}>{resetSent ? 'Reset email sent!' : 'Forgot?'}</button>
                )}
              </div>
              <input className="login-input" type="password" value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (localMessageTone === 'error') setLocalMessage('');
                }} placeholder="••••••••" required />
            </div>

            {/* Error */}
            {message && (
              <div style={{
                background: localMessageTone === 'success' && !error ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: localMessageTone === 'success' && !error ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(239,68,68,0.2)',
                borderRadius: 10, padding: '10px 14px', marginBottom: '1rem',
                color: localMessageTone === 'success' && !error ? '#86efac' : '#fca5a5', fontSize: 13, fontWeight: 500,
              }}>{message}</div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="login-btn login-btn-primary" style={{ marginBottom: 12 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                  Processing...
                </span>
              ) : (isRegistering ? 'Create Account' : 'Sign In')}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Google */}
            {onGoogleSignIn && (
              <button type="button" className="login-btn login-btn-google" style={{ marginBottom: 12 }} onClick={onGoogleSignIn}>
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                Google
              </button>
            )}

            {/* Demo */}
            {onSkipLogin && (
              <button type="button" onClick={onSkipLogin} className="login-btn login-btn-outline">
                🚀 Try Demo — No Sign-up Required
              </button>
            )}
          </form>

            {/* Terms */}
          <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: '1.5rem', lineHeight: 1.5, marginBottom: 0 }}>
            By continuing, you agree to our <button type="button" className="login-link" style={{ fontSize: 11 }} onClick={() => setLegalDoc('terms')}>Terms</button> and <button type="button" className="login-link" style={{ fontSize: 11 }} onClick={() => setLegalDoc('privacy')}>Privacy Policy</button>
          </p>
        </div>

        {/* Trust badges */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 24, zIndex: 2,
        }}>
          {[
            { icon: '🔒', text: '256-bit Encryption' },
            { icon: '🛡️', text: 'PDPA Compliant' },
            { icon: '☁️', text: 'Firebase Secured' },
          ].map(b => (
            <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14 }}>{b.icon}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400, letterSpacing: '0.02em' }}>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {legalContent && (
        <div className="login-modal-backdrop" onClick={() => setLegalDoc(null)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{legalContent.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Summary for MyTracksy account access</div>
              </div>
              <button type="button" onClick={() => setLegalDoc(null)} className="login-link" style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>✕</button>
            </div>
            <div style={{ padding: 24, display: 'grid', gap: 14 }}>
              {legalContent.summary.map((paragraph) => (
                <p key={paragraph} style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.82)' }}>
                  {paragraph}
                </p>
              ))}
              <div style={{ padding: 14, borderRadius: 14, background: 'rgba(99,102,241,0.12)', color: '#c7d2fe', fontSize: 13.5, lineHeight: 1.65 }}>
                For full legal text or compliance questions, contact the MyTracksy team before onboarding regulated client data.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SimpleLogin;
