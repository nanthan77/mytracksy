import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Profession types matching the build/ HTML app
export type ProfessionType =
  | 'medical' | 'legal' | 'engineering' | 'business'
  | 'individual' | 'trading' | 'automotive' | 'marketing'
  | 'travel' | 'transportation' | 'retail' | 'aquaculture' | 'creator';

// Sri Lankan user profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  photoURL?: string;
  preferredLanguage: 'en' | 'si' | 'ta';
  currency: 'LKR';
  location: {
    district?: string;
    province?: string;
    country: 'LK';
  };
  familyId?: string;
  memberType: 'individual' | 'family_head' | 'family_member';
  accountType: 'basic' | 'premium' | 'enterprise';
  profession?: ProfessionType;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    notifications: boolean;
    voiceCommands: boolean;
    smsIntegration: boolean;
    culturalAlerts: boolean;
    investmentTracking: boolean;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;

  // Authentication methods
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, displayName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithPhone: (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => Promise<any>;
  logout: () => Promise<void>;

  // Profile methods
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  verifyEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;

  // Sri Lankan specific methods
  setupSriLankanProfile: (data: Partial<UserProfile>) => Promise<void>;
  joinFamily: (familyId: string) => Promise<void>;
  createFamily: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  // Load user profile from Firestore
  const loadUserProfile = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data() as UserProfile;
        setUserProfile({
          ...profileData,
          createdAt: profileData.createdAt?.toDate?.() || new Date(),
          lastLoginAt: profileData.lastLoginAt?.toDate?.() || new Date()
        });

        // Update last login time
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: new Date()
        });
      } else {
        // Create default profile for new users
        await createDefaultProfile(user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Create default profile for new users
  const createDefaultProfile = async (user: User) => {
    const defaultProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      phoneNumber: user.phoneNumber || undefined,
      photoURL: user.photoURL || undefined,
      preferredLanguage: 'en',
      currency: 'LKR',
      location: {
        country: 'LK'
      },
      memberType: 'individual',
      accountType: 'basic',
      isEmailVerified: user.emailVerified,
      isPhoneVerified: !!user.phoneNumber,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: {
        notifications: true,
        voiceCommands: true,
        smsIntegration: true,
        culturalAlerts: true,
        investmentTracking: false
      }
    };

    await setDoc(doc(db, 'users', user.uid), defaultProfile);
    setUserProfile(defaultProfile);
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Update display name
    if (result.user) {
      await updateProfile(result.user, { displayName });
      await sendEmailVerification(result.user);
    }

    return result;
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    return signInWithPopup(auth, googleProvider);
  };

  // Sign in with phone number (for Sri Lankan users)
  const signInWithPhone = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
    // Format Sri Lankan phone numbers
    const formattedPhone = phoneNumber.startsWith('+94')
      ? phoneNumber
      : `+94${phoneNumber.replace(/^0/, '')}`;

    return signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No user logged in');

    await updateDoc(doc(db, 'users', currentUser.uid), updates);

    if (userProfile) {
      setUserProfile({ ...userProfile, ...updates });
    }
  };

  // Verify email
  const verifyEmail = async () => {
    if (!currentUser) throw new Error('No user logged in');
    return sendEmailVerification(currentUser);
  };

  // Reset password
  const resetPassword = async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Setup Sri Lankan specific profile
  const setupSriLankanProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('No user logged in');

    const updates = {
      ...data,
      currency: 'LKR' as const,
      location: {
        ...data.location,
        country: 'LK' as const
      }
    };

    await updateUserProfile(updates);
  };

  // Join a family
  const joinFamily = async (familyId: string) => {
    if (!currentUser) throw new Error('No user logged in');

    await updateUserProfile({
      familyId,
      memberType: 'family_member'
    });
  };

  // Create a new family
  const createFamily = async (): Promise<string> => {
    if (!currentUser) throw new Error('No user logged in');

    const familyId = `family_${currentUser.uid}_${Date.now()}`;

    // Create family document
    await setDoc(doc(db, 'families', familyId), {
      id: familyId,
      name: `${userProfile?.displayName || 'User'}'s Family`,
      headId: currentUser.uid,
      members: [currentUser.uid],
      createdAt: new Date(),
      currency: 'LKR',
      location: userProfile?.location || { country: 'LK' }
    });

    // Update user profile
    await updateUserProfile({
      familyId,
      memberType: 'family_head'
    });

    return familyId;
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        await loadUserProfile(user);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithPhone,
    logout,
    updateUserProfile,
    verifyEmail,
    resetPassword,
    setupSriLankanProfile,
    joinFamily,
    createFamily
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};