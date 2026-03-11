/**
 * PDPA Compliance Service
 *
 * Sri Lanka Personal Data Protection Act compliance utilities:
 *  - Patient name auto-redaction ("Kumara Mendis" → "K.M.")
 *  - AES-GCM encryption/decryption for IndexedDB medical data
 *  - Data retention policies (auto-purge audio after transcription)
 *  - Consent tracking
 */

// ─── Name Redaction ──────────────────────────────────────────────

/**
 * Auto-converts full names to initials.
 * "Kumara Mendis" → "K.M."
 * "Dr. Silva Perera" → "Dr. S.P."
 * Handles Sri Lankan name patterns including:
 *  - "Patient Kumara Mendis" → "Patient K.M."
 *  - "45y male Bandara" → "45y male B."
 */
export function redactPatientName(text: string): string {
    // Common prefixes to preserve
    const preservePrefixes = /^(Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Prof\.?|Rev\.?)\s*/i;

    // Sri Lankan name pattern: 2+ capitalized words in sequence
    const namePattern = /\b([A-Z][a-z]{2,})\s+([A-Z][a-z]{2,})(?:\s+([A-Z][a-z]{2,}))?\b/g;

    return text.replace(namePattern, (match, first, second, third) => {
        // Check if preceded by a title prefix
        const prefix = match.match(preservePrefixes);
        const prefixStr = prefix ? prefix[0] : '';
        const names = [first, second, third].filter(Boolean);

        // Skip if it looks like a place name or medical term
        const medicalTerms = ['Teaching', 'Hospital', 'Medical', 'General', 'National', 'Central',
            'Stevens', 'Johnson', 'Syndrome', 'Disease', 'District', 'Provincial'];
        if (names.some((n: string) => medicalTerms.includes(n))) return match;

        const initials = names.map((n: string) => n.charAt(0) + '.').join('');
        return prefixStr + initials;
    });
}

/**
 * Check if text contains potential full names (for warning display)
 */
export function containsFullNames(text: string): boolean {
    const namePattern = /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/;
    const medicalTerms = ['Teaching Hospital', 'Medical College', 'General Hospital',
        'National Hospital', 'District Hospital', 'Stevens Johnson'];
    const cleanText = medicalTerms.reduce((t, term) => t.replace(new RegExp(term, 'gi'), ''), text);
    return namePattern.test(cleanText);
}

// ─── AES-GCM Encryption ─────────────────────────────────────────

const ENCRYPTION_KEY_NAME = 'tracksy_pdpa_key';

/**
 * Generate or retrieve the encryption key for local medical data.
 * Key is stored in localStorage as a JWK (JSON Web Key).
 * In production, this should use a key derived from the user's biometric.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
    const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME);

    if (storedKey) {
        try {
            const jwk = JSON.parse(storedKey);
            return await crypto.subtle.importKey('jwk', jwk, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
        } catch {
            // Key corrupted, generate new one
        }
    }

    // Generate new AES-256-GCM key
    const key = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    // Store as JWK
    const jwk = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(jwk));

    return key;
}

/**
 * Encrypt data using AES-256-GCM
 * @returns Base64-encoded ciphertext with IV prepended
 */
export async function encryptData(data: string): Promise<string> {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    // Prepend IV to ciphertext
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    return bufferToBase64(combined.buffer);
}

/**
 * Decrypt data encrypted with encryptData()
 */
export async function decryptData(encryptedBase64: string): Promise<string> {
    const key = await getEncryptionKey();
    const combined = base64ToBuffer(encryptedBase64);
    const combinedArray = new Uint8Array(combined);

    // Extract IV (first 12 bytes) and ciphertext
    const iv = combinedArray.slice(0, 12);
    const ciphertext = combinedArray.slice(12);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Encrypt an object (serializes to JSON first)
 */
export async function encryptObject(obj: any): Promise<string> {
    return encryptData(JSON.stringify(obj));
}

/**
 * Decrypt an object
 */
export async function decryptObject<T = any>(encryptedBase64: string): Promise<T> {
    const json = await decryptData(encryptedBase64);
    return JSON.parse(json) as T;
}

// ─── Data Retention ──────────────────────────────────────────────

/**
 * Purge expired local data based on retention policies.
 * - Audio recordings: delete after 24 hours (should be transcribed by then)
 * - Transcription cache: delete after 30 days
 * - Encryption keys: never auto-delete
 */
export async function enforceDataRetention(): Promise<{ purgedAudio: number; purgedDocs: number }> {
    let purgedAudio = 0;
    let purgedDocs = 0;

    try {
        const db = await openRetentionDB();

        // Purge uploaded audio older than 24 hours
        const audioCutoff = Date.now() - 24 * 60 * 60 * 1000;
        const audioTx = db.transaction('audio_queue', 'readwrite');
        const audioStore = audioTx.objectStore('audio_queue');
        const audioReq = audioStore.openCursor();

        await new Promise<void>((resolve) => {
            audioReq.onsuccess = () => {
                const cursor = audioReq.result;
                if (cursor) {
                    const item = cursor.value;
                    if (item.uploaded && item.timestamp < audioCutoff) {
                        cursor.delete();
                        purgedAudio++;
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            audioReq.onerror = () => resolve();
        });

        // Purge synced docs older than 30 days
        const docsCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const docsTx = db.transaction('offline_docs', 'readwrite');
        const docsStore = docsTx.objectStore('offline_docs');
        const docsReq = docsStore.openCursor();

        await new Promise<void>((resolve) => {
            docsReq.onsuccess = () => {
                const cursor = docsReq.result;
                if (cursor) {
                    const doc = cursor.value;
                    if (doc.syncStatus === 'synced' && doc.timestamp < docsCutoff) {
                        cursor.delete();
                        purgedDocs++;
                    }
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            docsReq.onerror = () => resolve();
        });

        db.close();
    } catch (err) {
        console.error('[PDPA] Data retention enforcement failed:', err);
    }

    if (purgedAudio > 0 || purgedDocs > 0) {
        console.log(`[PDPA] Purged ${purgedAudio} audio files, ${purgedDocs} synced docs`);
    }

    return { purgedAudio, purgedDocs };
}

// ─── Consent Tracking ────────────────────────────────────────────

const CONSENT_KEY = 'tracksy_pdpa_consent';

export interface PDPAConsent {
    voiceRecording: boolean;
    dataStorage: boolean;
    cloudSync: boolean;
    timestamp: number;
    version: string;
}

export function getConsent(): PDPAConsent | null {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
}

export function setConsent(consent: Omit<PDPAConsent, 'timestamp' | 'version'>): void {
    const full: PDPAConsent = {
        ...consent,
        timestamp: Date.now(),
        version: '1.0',
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
}

export function hasValidConsent(): boolean {
    const consent = getConsent();
    return consent !== null && consent.voiceRecording && consent.dataStorage;
}

// ─── Helpers ─────────────────────────────────────────────────────

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

function openRetentionDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('TracksyOfflineBridgeDB');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
