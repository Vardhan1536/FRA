import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../utils/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For development, set a default user and skip Firebase authentication
    // In production, uncomment the Firebase code below
    const defaultUser: User = {
      role: 'GramaSabha',
      village: 'Demo Village',
      language: 'en',
      uid: 'demo-user-123',
      email: 'demo@gramasabha.gov.in',
      displayName: 'Demo User'
    };
    setCurrentUser(defaultUser);
    setLoading(false);
    
    // Firebase authentication (commented for development)
    // const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    //   if (firebaseUser) {
    //     // In a real app, you would fetch user role from your backend
    //     const userData: User = {
    //       role: 'GramaSabha',
    //       village: 'Demo Village',
    //       language: 'en',
    //       uid: firebaseUser.uid,
    //       email: firebaseUser.email || '',
    //       displayName: firebaseUser.displayName || 'User'
    //     };
    //     setCurrentUser(userData);
    //   } else {
    //     setCurrentUser(null);
    //   }
    //   setLoading(false);
    // });

    // return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    // For development, create a mock user
    // In production, use: await signInWithEmailAndPassword(auth, email, password);
    const userData: User = {
      role: 'GramaSabha',
      village: 'Demo Village',
      language: 'en',
      uid: 'demo-user-123',
      email: email,
      displayName: 'Demo User'
    };
    setCurrentUser(userData);
  };

  const logout = async () => {
    // For development, just clear the user
    // In production, use: await signOut(auth);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};