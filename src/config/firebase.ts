import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for MyTracksy Sri Lanka
// SECURITY: All values MUST come from environment variables — no hardcoded fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required Firebase config at startup — fail fast if .env is missing
const requiredConfigKeys: (keyof typeof firebaseConfig)[] = [
  'apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'
];
for (const key of requiredConfigKeys) {
  if (!firebaseConfig[key]) {
    throw new Error(
      `Missing required Firebase config: VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}. ` +
      `Check your .env file.`
    );
  }
}

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// H4: Firebase App Check — protects backend resources from abuse
// Only initialize if sitekey is configured (empty key causes auth-blocking errors)
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
if (typeof window !== 'undefined' && recaptchaSiteKey) {
  import('firebase/app-check').then(({ initializeAppCheck, ReCaptchaEnterpriseProvider }) => {
    try {
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    } catch (error) {
      console.warn('Firebase App Check not available:', error);
    }
  }).catch(() => {
    console.warn('Firebase App Check module not available');
  });
}

// Initialize Analytics safely (optional, won't crash if it fails)
let analytics: any = null;
if (typeof window !== 'undefined') {
  import('firebase/analytics').then(({ getAnalytics }) => {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Firebase Analytics not available:', error);
    }
  }).catch(() => {
    console.warn('Firebase Analytics module not available');
  });
}
export { analytics };

export default app;