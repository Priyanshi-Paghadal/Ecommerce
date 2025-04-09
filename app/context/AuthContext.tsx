'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  error: null,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', user.uid), {
              role: 'user',
              email: user.email,
              createdAt: new Date().toISOString()
            });
            setIsAdmin(false);
          } else {
            setIsAdmin(userDoc.data()?.role === 'admin');
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signup = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        role: 'user',
        email: email,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user document
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          role: 'user',
          email: email,
          createdAt: new Date().toISOString()
        });
        setIsAdmin(false);
      } else {
        setIsAdmin(userDoc.data()?.role === 'admin');
      }
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      setError(authError.message);
      throw authError;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, error, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 