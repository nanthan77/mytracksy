import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration for MyTracksy Sri Lanka
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBnRy9L2hMx12QvraOOeK49ZbaaHFUV6uQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tracksy-8e30c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tracksy-8e30c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tracksy-8e30c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "941924690758",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:941924690758:web:ac3e5c4fc9aac58a5c9347",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FH9Q1PGV0H"
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics safely (optional, won't crash if it fails)
let analytics: any = null;
if (typeof window !== 'undefined') {
  try {
    const { getAnalytics } = await import('firebase/analytics');
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Firebase Analytics not available:', error);
  }
}
export { analytics };

export default app;