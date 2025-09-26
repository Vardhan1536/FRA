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
    // For development, start with no user to show login page
    // In production, uncomment the Firebase code below
    setCurrentUser(null);
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
    
    // Determine role based on email for demo purposes
    let role: 'GramaSabha' | 'SDLC' | 'DLC' = 'GramaSabha';
    let district: string | undefined = undefined;
    let displayName = 'Demo User';
    
    if (email.includes('sdlc')) {
      role = 'SDLC';
      district = 'Demo District';
      displayName = 'SDLC Officer';
    } else if (email.includes('dlc')) {
      role = 'DLC';
      district = 'Demo District';
      displayName = 'DLC Officer';
    } else if (email.includes('gramasabha')) {
      role = 'GramaSabha';
      displayName = 'Grama Sabha Officer';
    }
    
    const userData: User = {
      role,
      village: 'Demo Village',
      district,
      language: 'en',
      uid: `demo-user-${Date.now()}`,
      email: email,
      displayName
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