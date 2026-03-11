import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { mockAuth, MockUser } from '../services/mockAuth';
import { mockFirestore } from '../services/mockFirestore';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updateUserPassword: (newPassword: string, currentPassword: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
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
  const [loading, setLoading] = useState(true);
  const [useMockAuth] = useState(false); // Production: use real Firebase auth

  const login = async (email: string, password: string) => {
    try {
      if (useMockAuth) {
        await mockAuth.signInWithEmailAndPassword(email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error('AuthContext: Login failed');
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      if (useMockAuth) {
        const { user } = await mockAuth.createUserWithEmailAndPassword(email, password);
        await mockAuth.updateProfile(user, { displayName });

        // Create user document in mock Firestore
        await mockFirestore.setDoc('users', user.uid, {
          uid: user.uid,
          email: user.email,
          displayName,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName });

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    } catch (error) {
      console.error('AuthContext: Registration failed');
      throw error;
    }
  };

  const logout = async () => {
    if (useMockAuth) {
      await mockAuth.signOut();
    } else {
      await signOut(auth);
    }
  };

  const resetPassword = async (email: string) => {
    if (useMockAuth) {
      // Mock password reset
      return Promise.resolve();
    } else {
      await sendPasswordResetEmail(auth, email);
    }
  };

  const updateUserEmail = async (newEmail: string, currentPassword: string) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    if (useMockAuth) {
      // Mock email update
      const updatedUser = { ...currentUser, email: newEmail };
      setCurrentUser(updatedUser);
      await mockFirestore.setDoc('users', currentUser.uid, {
        email: newEmail,
        updatedAt: new Date()
      }, { merge: true });
    } else {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updateEmail(auth.currentUser, newEmail);
      
      // Update user document in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        email: newEmail,
        updatedAt: new Date()
      }, { merge: true });
    }
  };

  const updateUserPassword = async (newPassword: string, currentPassword: string) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    if (useMockAuth) {
      // Mock password update
      return Promise.resolve();
    } else {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    }
  };

  const updateUserProfile = async (displayName: string, photoURL?: string) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }
    
    if (useMockAuth) {
      // Update mock user profile
      await mockAuth.updateProfile(currentUser as MockUser, { displayName, photoURL });
      const updatedUser = { ...currentUser, displayName, photoURL: photoURL || currentUser.photoURL };
      setCurrentUser(updatedUser);
      await mockFirestore.setDoc('users', currentUser.uid, {
        displayName,
        photoURL: photoURL || null,
        updatedAt: new Date()
      }, { merge: true });
    } else {
      if (!auth.currentUser) {
        throw new Error('No user logged in');
      }
      await updateProfile(auth.currentUser, { displayName, photoURL });
      
      // Update user document in Firestore
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        photoURL: photoURL || null,
        updatedAt: new Date()
      }, { merge: true });
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (useMockAuth) {
      // Use mock auth state listener
      unsubscribe = mockAuth.onAuthStateChanged(async (mockUser: MockUser | null) => {
        try {
          if (mockUser) {
            // Get additional user data from mock Firestore
            const userDoc = await mockFirestore.getDoc('users', mockUser.uid);
            const userData = userDoc.exists() ? userDoc.data() : null;

            const user: User = {
              uid: mockUser.uid,
              email: mockUser.email,
              displayName: mockUser.displayName || userData?.displayName || undefined,
              photoURL: mockUser.photoURL || userData?.photoURL || undefined
            };
            setCurrentUser(user);
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Mock auth state change failed');
          setCurrentUser(null);
        } finally {
          setLoading(false);
        }
      });
    } else {
      // Use Firebase auth state listener
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            // Get additional user data from Firestore
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            const userData = userDoc.data();

            const user: User = {
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || userData?.displayName || undefined,
              photoURL: firebaseUser.photoURL || userData?.photoURL || undefined
            };
            setCurrentUser(user);
          } else {
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Auth state change failed');
          setCurrentUser(null);
        } finally {
          setLoading(false);
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [useMockAuth]);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};