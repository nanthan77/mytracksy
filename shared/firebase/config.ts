import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBnRy9L2hMx12QvraOOeK49ZbaaHFUV6uQ",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tracksy-8e30c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tracksy-8e30c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tracksy-8e30c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "941924690758",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:941924690758:web:ac3e5c4fc9aac58a5c9347",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FH9Q1PGV0H"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'asia-south1');
export { app };
export default app;
