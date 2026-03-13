/**
 * Biometric Authentication Service
 *
 * Uses Web Authentication API (WebAuthn) for FaceID/Fingerprint.
 * Graceful fallback to PIN for unsupported browsers.
 *
 * H5: Credentials stored in Firestore (users/{uid}/settings/biometric),
 *     only ephemeral session flag remains in localStorage.
 *
 * - isBiometricAvailable() — check platform support
 * - enrollBiometric()      — register fingerprint/face
 * - authenticateBiometric() — challenge before accessing locked sections
 * - PIN fallback for older devices
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const SESSION_KEY = 'tracksy_biometric_session';
const SESSION_DURATION = 15 * 60 * 1000; // 15 minutes

export interface BiometricStatus {
    available: boolean;
    enrolled: boolean;
    sessionActive: boolean;
    method: 'biometric' | 'pin' | 'none';
}

/** Returns the Firestore doc ref for the current user's biometric settings */
function getBiometricDocRef(userId: string) {
    return doc(db, 'users', userId, 'settings', 'biometric');
}

interface BiometricDoc {
    credentialId?: string;
    pinHash?: string;
    pinSalt?: string;
    method: 'biometric' | 'pin' | 'none';
    enrolledAt: string;
}

class BiometricAuthService {
    private static instance: BiometricAuthService;
    // In-memory cache to avoid repeated Firestore reads in a single session
    private cachedDoc: BiometricDoc | null = null;
    private cachedUid: string | null = null;

    static getInstance(): BiometricAuthService {
        if (!BiometricAuthService.instance) {
            BiometricAuthService.instance = new BiometricAuthService();
        }
        return BiometricAuthService.instance;
    }

    private getUid(): string {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error('[BiometricAuth] No authenticated user');
        return uid;
    }

    /** Fetch biometric doc from Firestore (cached per uid per session) */
    private async loadDoc(uid: string): Promise<BiometricDoc | null> {
        if (this.cachedUid === uid && this.cachedDoc) return this.cachedDoc;
        try {
            const snap = await getDoc(getBiometricDocRef(uid));
            if (snap.exists()) {
                this.cachedDoc = snap.data() as BiometricDoc;
                this.cachedUid = uid;
                return this.cachedDoc;
            }
        } catch (e) {
            console.warn('[BiometricAuth] Firestore read failed:', e);
        }
        this.cachedDoc = null;
        this.cachedUid = uid;
        return null;
    }

    private async saveDoc(uid: string, data: BiometricDoc): Promise<void> {
        await setDoc(getBiometricDocRef(uid), data);
        this.cachedDoc = data;
        this.cachedUid = uid;
    }

    /** Invalidate cache (call after unenroll or when user changes) */
    clearCache(): void {
        this.cachedDoc = null;
        this.cachedUid = null;
    }

    // ─── Availability Check ────────────────────────────────────────

    async isBiometricAvailable(): Promise<boolean> {
        try {
            if (!window.PublicKeyCredential) return false;
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
            return false;
        }
    }

    async isEnrolled(): Promise<boolean> {
        try {
            const uid = this.getUid();
            const d = await this.loadDoc(uid);
            return d !== null && d.method !== 'none';
        } catch {
            return false;
        }
    }

    async getMethod(): Promise<'biometric' | 'pin' | 'none'> {
        try {
            const uid = this.getUid();
            const d = await this.loadDoc(uid);
            return d?.method ?? 'none';
        } catch {
            return 'none';
        }
    }

    async getStatus(): Promise<BiometricStatus> {
        const available = await this.isBiometricAvailable();
        const method = await this.getMethod();
        return {
            available,
            enrolled: method !== 'none',
            sessionActive: this.isSessionActive(),
            method,
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
                        authenticatorAttachment: 'platform',
                        userVerification: 'required',
                        residentKey: 'preferred',
                    },
                    timeout: 60000,
                    attestation: 'none',
                },
            }) as PublicKeyCredential | null;

            if (credential) {
                const credId = this.bufferToBase64(credential.rawId);
                // H5: Store credential in Firestore, not localStorage
                await this.saveDoc(userId, {
                    credentialId: credId,
                    method: 'biometric',
                    enrolledAt: new Date().toISOString(),
                });
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
            const uid = this.getUid();
            const { hash, salt } = await this.hashPIN(pin);
            // H5: Store PIN hash in Firestore, not localStorage
            await this.saveDoc(uid, {
                pinHash: hash,
                pinSalt: salt,
                method: 'pin',
                enrolledAt: new Date().toISOString(),
            });
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
            const uid = this.getUid();
            const d = await this.loadDoc(uid);
            if (!d?.credentialId) return false;

            const challenge = crypto.getRandomValues(new Uint8Array(32));

            const assertion = await navigator.credentials.get({
                publicKey: {
                    challenge,
                    allowCredentials: [
                        {
                            id: this.base64ToBuffer(d.credentialId),
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
            const uid = this.getUid();
            const d = await this.loadDoc(uid);
            if (!d?.pinHash || !d?.pinSalt) return false;

            const { hash } = await this.hashPIN(pin, d.pinSalt);
            if (hash === d.pinHash) {
                this.startSession();
                return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    // ─── Session Management (ephemeral — localStorage is acceptable) ──

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
            this.startSession();
        }
    }

    // ─── Unenroll ──────────────────────────────────────────────────

    async unenroll(): Promise<void> {
        try {
            const uid = this.getUid();
            await deleteDoc(getBiometricDocRef(uid));
        } catch (e) {
            console.warn('[BiometricAuth] Firestore delete failed:', e);
        }
        localStorage.removeItem(SESSION_KEY);
        this.clearCache();
    }

    // ─── Helpers ───────────────────────────────────────────────────

    private async hashPIN(pin: string, existingSalt?: string): Promise<{ hash: string; salt: string }> {
        const salt = existingSalt ?? this.bufferToBase64(crypto.getRandomValues(new Uint8Array(32)).buffer);

        // PBKDF2 with 600,000 iterations — OWASP recommended for banking-level security
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(pin),
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const derived = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: this.base64ToBuffer(salt),
                iterations: 600000,
                hash: 'SHA-256',
            },
            keyMaterial,
            256
        );

        return { hash: this.bufferToBase64(derived), salt };
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
