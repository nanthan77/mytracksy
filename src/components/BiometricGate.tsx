import React, { useState, useEffect, useCallback } from 'react';
import { biometricAuth, BiometricStatus } from '../services/biometricAuthService';

interface BiometricGateProps {
    children: React.ReactNode;
    sectionName: string;
    sectionIcon?: string;
}

/**
 * BiometricGate — wraps sensitive sections with biometric/PIN lock.
 * Used for Voice Vault, Accounting, and other premium/sensitive areas.
 */
const BiometricGate: React.FC<BiometricGateProps> = ({ children, sectionName, sectionIcon = '🔒' }) => {
    const [status, setStatus] = useState<BiometricStatus | null>(null);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [showPinInput, setShowPinInput] = useState(false);
    const [pinValue, setPinValue] = useState('');
    const [pinConfirm, setPinConfirm] = useState('');
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        const s = await biometricAuth.getStatus();
        setStatus(s);
        if (s.sessionActive) {
            setIsUnlocked(true);
        }
    };

    const handleBiometricAuth = useCallback(async () => {
        setIsAuthenticating(true);
        setError('');

        try {
            const success = await biometricAuth.authenticateBiometric();
            if (success) {
                setIsUnlocked(true);
            } else {
                setError('Authentication failed. Try again or use PIN.');
                triggerShake();
            }
        } catch {
            setError('Biometric not available. Use PIN instead.');
            setShowPinInput(true);
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const handlePinAuth = async () => {
        if (pinValue.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }

        setIsAuthenticating(true);
        const success = await biometricAuth.authenticatePIN(pinValue);
        setIsAuthenticating(false);

        if (success) {
            setIsUnlocked(true);
            setPinValue('');
        } else {
            setError('Incorrect PIN');
            setPinValue('');
            triggerShake();
        }
    };

    const handleEnrollBiometric = async () => {
        setIsEnrolling(true);
        setError('');

        const success = await biometricAuth.enrollBiometric('tracksy_user');
        if (success) {
            await checkStatus();
            setIsUnlocked(true);
        } else {
            setError('Biometric enrollment failed. Set up a PIN instead.');
            setShowPinInput(true);
            setIsEnrolling(true); // Keep in enrollment mode
        }
        setIsEnrolling(false);
    };

    const handleEnrollPin = async () => {
        if (pinValue.length < 4) {
            setError('PIN must be at least 4 digits');
            return;
        }
        if (pinValue !== pinConfirm) {
            setError('PINs do not match');
            return;
        }

        const success = await biometricAuth.enrollPIN(pinValue);
        if (success) {
            await checkStatus();
            setIsUnlocked(true);
            setPinValue('');
            setPinConfirm('');
        }
    };

    const triggerShake = () => {
        setShake(true);
        setTimeout(() => setShake(false), 600);
    };

    // If unlocked, render children
    if (isUnlocked) {
        return <>{children}</>;
    }

    // Loading state
    if (!status) {
        return (
            <div style={styles.container}>
                <div style={styles.spinner} />
            </div>
        );
    }

    // Not enrolled — show enrollment screen
    if (!status.enrolled) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.card, ...(shake ? styles.shake : {}) }}>
                    <div style={styles.shieldIcon}>🛡️</div>
                    <h2 style={styles.title}>Secure This Section</h2>
                    <p style={styles.subtitle}>
                        <strong>{sectionIcon} {sectionName}</strong> contains sensitive data.
                        <br />Set up biometric or PIN lock for PDPA compliance.
                    </p>

                    {!showPinInput ? (
                        <>
                            {status.available && (
                                <button
                                    style={styles.biometricButton}
                                    onClick={handleEnrollBiometric}
                                    disabled={isEnrolling}
                                >
                                    <span style={styles.buttonIcon}>
                                        {isEnrolling ? '⏳' : '👆'}
                                    </span>
                                    {isEnrolling ? 'Setting up...' : 'Use FaceID / Fingerprint'}
                                </button>
                            )}
                            <button
                                style={styles.pinButton}
                                onClick={() => { setShowPinInput(true); setIsEnrolling(true); }}
                            >
                                <span style={styles.buttonIcon}>🔢</span>
                                Set Up PIN Code
                            </button>
                        </>
                    ) : (
                        <div style={styles.pinContainer}>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="Create PIN (4-6 digits)"
                                value={pinValue}
                                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                                style={styles.pinInput}
                                autoFocus
                            />
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="Confirm PIN"
                                value={pinConfirm}
                                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                                style={styles.pinInput}
                            />
                            <button style={styles.biometricButton} onClick={handleEnrollPin}>
                                Confirm PIN
                            </button>
                        </div>
                    )}

                    {error && <p style={styles.error}>{error}</p>}

                    <p style={styles.pdpaBadge}>
                        🔏 PDPA Compliant · Data encrypted at rest
                    </p>
                </div>
            </div>
        );
    }

    // Enrolled — show unlock screen
    return (
        <div style={styles.container}>
            <div style={{ ...styles.card, ...(shake ? styles.shake : {}) }}>
                <div style={styles.lockIcon}>{sectionIcon}</div>
                <h2 style={styles.title}>{sectionName}</h2>
                <p style={styles.subtitle}>This section is locked for your privacy</p>

                {!showPinInput && status.method === 'biometric' ? (
                    <button
                        style={styles.biometricButton}
                        onClick={handleBiometricAuth}
                        disabled={isAuthenticating}
                    >
                        <span style={styles.buttonIcon}>
                            {isAuthenticating ? '⏳' : '👆'}
                        </span>
                        {isAuthenticating ? 'Verifying...' : 'Unlock with FaceID / Fingerprint'}
                    </button>
                ) : null}

                {(showPinInput || status.method === 'pin') && (
                    <div style={styles.pinContainer}>
                        <input
                            type="password"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="Enter PIN"
                            value={pinValue}
                            onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                            onKeyDown={(e) => e.key === 'Enter' && handlePinAuth()}
                            style={styles.pinInput}
                            autoFocus
                        />
                        <button
                            style={styles.biometricButton}
                            onClick={handlePinAuth}
                            disabled={isAuthenticating}
                        >
                            {isAuthenticating ? 'Verifying...' : 'Unlock'}
                        </button>
                    </div>
                )}

                {status.method === 'biometric' && !showPinInput && (
                    <button style={styles.linkButton} onClick={() => setShowPinInput(true)}>
                        Use PIN instead
                    </button>
                )}

                {error && <p style={styles.error}>{error}</p>}

                <p style={styles.pdpaBadge}>
                    🔏 Protected · Session expires in 15 min
                </p>
            </div>
        </div>
    );
};

// ─── Styles ──────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '2rem',
    },
    card: {
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        maxWidth: '420px',
        width: '100%',
        textAlign: 'center' as const,
        boxShadow: '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
        animation: 'fadeIn 0.3s ease-out',
    },
    shake: {
        animation: 'shake 0.6s ease-in-out',
    },
    shieldIcon: {
        fontSize: '4rem',
        marginBottom: '1rem',
        filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
    },
    lockIcon: {
        fontSize: '4rem',
        marginBottom: '1rem',
        opacity: 0.9,
    },
    title: {
        color: '#fff',
        fontSize: '1.5rem',
        fontWeight: 700,
        margin: '0 0 0.5rem 0',
        fontFamily: "'Inter', -apple-system, sans-serif",
    },
    subtitle: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '0.9rem',
        lineHeight: 1.5,
        margin: '0 0 2rem 0',
    },
    biometricButton: {
        width: '100%',
        padding: '14px 24px',
        borderRadius: '14px',
        border: 'none',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '12px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    },
    pinButton: {
        width: '100%',
        padding: '14px 24px',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.05)',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '1rem',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        marginBottom: '12px',
        transition: 'background 0.2s',
    },
    buttonIcon: {
        fontSize: '1.2rem',
    },
    pinContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px',
    },
    pinInput: {
        width: '100%',
        padding: '14px',
        borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.15)',
        background: 'rgba(255,255,255,0.08)',
        color: '#fff',
        fontSize: '1.5rem',
        textAlign: 'center' as const,
        letterSpacing: '0.5em',
        outline: 'none',
        fontFamily: 'monospace',
        boxSizing: 'border-box' as const,
    },
    linkButton: {
        background: 'none',
        border: 'none',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.85rem',
        cursor: 'pointer',
        textDecoration: 'underline',
        marginTop: '8px',
    },
    error: {
        color: '#ff6b6b',
        fontSize: '0.85rem',
        marginTop: '12px',
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'rgba(255,107,107,0.1)',
    },
    pdpaBadge: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: '0.75rem',
        marginTop: '2rem',
        letterSpacing: '0.05em',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#667eea',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
};

// Inject keyframes
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
      20%, 40%, 60%, 80% { transform: translateX(8px); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
    document.head.appendChild(styleEl);
}

export default BiometricGate;
