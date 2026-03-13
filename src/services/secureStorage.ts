/**
 * secureStorage.ts — Encrypted localStorage Wrapper
 *
 * Banking-level AES-256-GCM encryption for all localStorage data.
 * Uses the same non-extractable key infrastructure from pdpaService.ts.
 *
 * Usage:
 *   import { secureStorage } from './secureStorage';
 *   await secureStorage.setItem('expenses', JSON.stringify(data));
 *   const data = await secureStorage.getItem('expenses');
 *
 * Fallback: If crypto.subtle is unavailable (e.g. HTTP localhost),
 * data is base64-encoded (not encrypted) with a console warning.
 */

const ENCRYPTION_DB_NAME = 'TracksyKeyStore';
const ENCRYPTION_STORE_NAME = 'keys';
const SECURE_STORAGE_KEY_ID = 'secure_storage_master';

// ─── IndexedDB Key Store ────────────────────────────────────────

function openKeyStore(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(ENCRYPTION_DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(ENCRYPTION_STORE_NAME)) {
                db.createObjectStore(ENCRYPTION_STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

let _cachedKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
    if (_cachedKey) return _cachedKey;

    const db = await openKeyStore();

    // Try to retrieve existing key
    const existing = await new Promise<CryptoKey | null>((resolve) => {
        const tx = db.transaction(ENCRYPTION_STORE_NAME, 'readonly');
        const store = tx.objectStore(ENCRYPTION_STORE_NAME);
        const req = store.get(SECURE_STORAGE_KEY_ID);
        req.onsuccess = () => resolve(req.result?.key ?? null);
        req.onerror = () => resolve(null);
    });

    if (existing) {
        db.close();
        _cachedKey = existing;
        return existing;
    }

    // Generate new AES-256-GCM key (non-extractable = banking-grade)
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        false, // non-extractable — key material cannot be read by JS or extensions
        ['encrypt', 'decrypt']
    );

    // Store CryptoKey object in IndexedDB (structured clone preserves it)
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(ENCRYPTION_STORE_NAME, 'readwrite');
        const store = tx.objectStore(ENCRYPTION_STORE_NAME);
        store.put({ id: SECURE_STORAGE_KEY_ID, key, createdAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });

    db.close();
    _cachedKey = key;
    return key;
}

// ─── Helpers ────────────────────────────────────────────────────

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

// ─── Crypto availability check ──────────────────────────────────

function isCryptoAvailable(): boolean {
    return typeof crypto !== 'undefined'
        && typeof crypto.subtle !== 'undefined'
        && typeof indexedDB !== 'undefined';
}

// ─── Encrypted Storage Service ──────────────────────────────────

class SecureStorageService {
    private static instance: SecureStorageService;

    static getInstance(): SecureStorageService {
        if (!SecureStorageService.instance) {
            SecureStorageService.instance = new SecureStorageService();
        }
        return SecureStorageService.instance;
    }

    /**
     * Encrypt and store data in localStorage
     */
    async setItem(key: string, value: string): Promise<void> {
        if (!isCryptoAvailable()) {
            // Fallback: base64 encode (obfuscation, not encryption)
            localStorage.setItem(key, btoa(unescape(encodeURIComponent(value))));
            return;
        }

        try {
            const cryptoKey = await getEncryptionKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(value);

            const cipherBuffer = await crypto.subtle.encrypt(
                { name: 'AES-GCM', iv },
                cryptoKey,
                encoded
            );

            // Prepend IV to ciphertext
            const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(cipherBuffer), iv.length);

            // Store as: ENC: prefix + base64
            localStorage.setItem(key, 'ENC:' + bufferToBase64(combined.buffer));
        } catch (err) {
            console.warn('[SecureStorage] Encryption failed, storing plaintext:', err);
            localStorage.setItem(key, value);
        }
    }

    /**
     * Retrieve and decrypt data from localStorage
     */
    async getItem(key: string): Promise<string | null> {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;

        // Check if data is encrypted (has ENC: prefix)
        if (!raw.startsWith('ENC:')) {
            // Legacy plaintext data — return as-is (will be encrypted on next write)
            return raw;
        }

        if (!isCryptoAvailable()) {
            // Fallback: try base64 decode
            try {
                return decodeURIComponent(escape(atob(raw.slice(4))));
            } catch {
                return raw.slice(4);
            }
        }

        try {
            const cryptoKey = await getEncryptionKey();
            const combined = new Uint8Array(base64ToBuffer(raw.slice(4))); // Remove 'ENC:' prefix

            // Extract IV (first 12 bytes) and ciphertext
            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                cryptoKey,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.warn('[SecureStorage] Decryption failed for key:', key, err);
            // If decryption fails, it might be legacy plaintext
            return raw.startsWith('ENC:') ? null : raw;
        }
    }

    /**
     * Remove item from localStorage
     */
    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    /**
     * Clear all localStorage
     */
    clear(): void {
        localStorage.clear();
    }

    /**
     * Synchronous getItem for backward compatibility.
     * Returns raw data (may be encrypted). Use async getItem for decrypted data.
     */
    getItemSync(key: string): string | null {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        // If encrypted, return null (caller must use async version)
        if (raw.startsWith('ENC:')) return null;
        return raw;
    }

    /**
     * Check if a key exists in localStorage
     */
    hasItem(key: string): boolean {
        return localStorage.getItem(key) !== null;
    }
}

export const secureStorage = SecureStorageService.getInstance();
export default SecureStorageService;
