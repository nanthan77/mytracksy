/**
 * Biometric Authentication Service
 *
 * Uses Web Authentication API (WebAuthn) for FaceID/Fingerprint.
 * Graceful fallback to PIN for unsupported browsers.
 *
 * - isBiometricAvailable() — check platform support
 * - enrollBiometric()      — register fingerprint/face
 * - authenticateBiometric() — challenge before accessing locked sections
 * - PIN fallback for older devices
 */

const CREDENTIAL_KEY = 'tracksy_biometric_credential';
const PIN_KEY = 'tracksy_pin_hash';
const SESSION_KEY = 'tracksy_biometric_session';
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

export interface BiometricStatus {
    available: boolean;
    enrolled: boolean;
    sessionActive: boolean;
    method: 'biometric' | 'pin' | 'none';
}

class BiometricAuthService {
    private static instance: BiometricAuthService;

    static getInstance(): BiometricAuthService {
        if (!BiometricAuthService.instance) {
            BiometricAuthService.instance = new BiometricAuthService();
        }
        return BiometricAuthService.instance;
    }

    // ─── Availability Check ────────────────────────────────────────

    async isBiometricAvailable(): Promise<boolean> {
        try {
            if (!window.PublicKeyCredential) return false;

            const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            return available;
        } catch {
            return false;
        }
    }

    isEnrolled(): boolean {
        return !!localStorage.getItem(CREDENTIAL_KEY) || !!localStorage.getItem(PIN_KEY);
    }

    getMethod(): 'biometric' | 'pin' | 'none' {
        if (localStorage.getItem(CREDENTIAL_KEY)) return 'biometric';
        if (localStorage.getItem(PIN_KEY)) return 'pin';
        return 'none';
    }

    async getStatus(): Promise<BiometricStatus> {
        const available = await this.isBiometricAvailable();
        return {
            available,
            enrolled: this.isEnrolled(),
            sessionActive: this.isSessionActive(),
            method: this.getMethod(),
        };
    }

    // ─── Enrollment ────────────────────────────────────────────────

    async enrollBiometric(userId: string): Promise<boolean> {
        try {
            const available = await this.isBiometricAvailable();
            if (!available) return false;

            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const userIdBuffer = new TextEncoder().encode(userId);

            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: 'MyTracksy', id: window.location.hostname },
                    user: {
                        id: userIdBuffer,
                        name: userId,
                        displayName: 'MyTracksy User',
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' },   // ES256
                        { alg: -257, type: 'public-key' },  // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform', // Must be device biometric (FaceID, Touch ID)
                        userVerification: 'required',
                        residentKey: 'preferred',
                    },
                    timeout: 60000,
                    attestation: 'none',
                },
            }) as PublicKeyCredential | null;

            if (credential) {
                // Store credential ID for future authentication
                const credId = this.bufferToBase64(credential.rawId);
                localStorage.setItem(CREDENTIAL_KEY, credId);
                this.startSession();
                return true;
            }
            return false;
        } catch (err) {
            console.error('[BiometricAuth] Enrollment failed:', err);
            return false;
        }
    }

    async enrollPIN(pin: string): Promise<boolean> {
        try {
            const hash = await this.hashPIN(pin);
            localStorage.setItem(PIN_KEY, hash);
            this.startSession();
            return true;
        } catch (err) {
            console.error('[BiometricAuth] PIN enrollment failed:', err);
            return false;
        }
    }

    // ─── Authentication ────────────────────────────────────────────

    async authenticateBiometric(): Promise<boolean> {
        try {
            const credId = localStorage.getItem(CREDENTIAL_KEY);
            if (!credId) return false;

            const challenge = crypto.getRandomValues(new Uint8Array(32));

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    allowCredentials: [
                        {
                            id: this.base64ToBuffer(credId),
                            type: 'public-key',
                            transports: ['internal'],
                        },
                    ],
                    userVerification: 'required',
                    timeout: 60000,
                },
            }) as PublicKeyCredential | null;

            if (assertion) {
                this.startSession();
                return true;
            }
            return false;
        } catch (err) {
            console.error('[BiometricAuth] Authentication failed:', err);
            return false;
        }
    }

    async authenticatePIN(pin: string): Promise<boolean> {
        try {
            const storedHash = localStorage.getItem(PIN_KEY);
            if (!storedHash) return false;

            const hash = await this.hashPIN(pin);
            if (hash === storedHash) {
                this.startSession();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // ─── Session Management ────────────────────────────────────────

    isSessionActive(): boolean {
        const session = localStorage.getItem(SESSION_KEY);
        if (!session) return false;

        const expiresAt = parseInt(session, 10);
        if (Date.now() > expiresAt) {
            localStorage.removeItem(SESSION_KEY);
            return false;
        }
        return true;
    }

    startSession(): void {
        localStorage.setItem(SESSION_KEY, (Date.now() + SESSION_DURATION).toString());
    }

    endSession(): void {
        localStorage.removeItem(SESSION_KEY);
    }

    extendSession(): void {
        if (this.isSessionActive()) {
            this.startSession(); // Reset timer
        }
    }

    // ─── Unenroll ──────────────────────────────────────────────────

    unenroll(): void {
        localStorage.removeItem(CREDENTIAL_KEY);
        localStorage.removeItem(PIN_KEY);
        localStorage.removeItem(SESSION_KEY);
    }

    // ─── Helpers ───────────────────────────────────────────────────

    private async hashPIN(pin: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(pin + 'tracksy_salt_v1');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return this.bufferToBase64(hashBuffer);
    }

    private bufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (const b of bytes) binary += String.fromCharCode(b);
        return btoa(binary);
    }

    private base64ToBuffer(base64: string): ArrayBuffer {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes.buffer;
    }
}

export const biometricAuth = BiometricAuthService.getInstance();
export default BiometricAuthService;
