import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  type User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  deleteUser,
  type UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider, githubProvider } from '../config/firebase';
import type { AuthContextType, UserProfile, AuthProvider as AuthProviderType } from '../types/auth';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Crear o actualizar perfil de usuario en Firestore (con fallback)
  const createOrUpdateUserProfile = async (firebaseUser: FirebaseUser, provider: AuthProviderType): Promise<UserProfile> => {
    const now = new Date();

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // Usuario existente - actualizar último login
        const existingUser = userSnap.data() as UserProfile;

        try {
          await updateDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            displayName: firebaseUser.displayName || existingUser.displayName,
            photoURL: firebaseUser.photoURL || existingUser.photoURL,
          });
        } catch (error) {
          console.warn('No se pudo actualizar en Firestore, usando datos locales');
        }

        return {
          ...existingUser,
          lastLoginAt: now,
          displayName: firebaseUser.displayName || existingUser.displayName,
          photoURL: firebaseUser.photoURL || existingUser.photoURL,
        };
      } else {
        // Nuevo usuario - crear perfil
        const newUserProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'Usuario',
          photoURL: firebaseUser.photoURL || undefined,
          provider: provider,
          createdAt: now,
          lastLoginAt: now,
          isPremium: false,
          subscriptionStatus: 'free',
          dailyConversions: 0,
          adWatches: 0,
          totalConversions: 0,
        };

        try {
          await setDoc(userRef, {
            ...newUserProfile,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
          });
        } catch (error) {
          console.warn('No se pudo guardar en Firestore, usando perfil local');
        }

        return newUserProfile;
      }
    } catch (error) {
      console.warn('Firestore no disponible, creando perfil local');
      // Crear perfil básico sin Firestore
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Usuario',
        photoURL: firebaseUser.photoURL || undefined,
        provider: provider,
        createdAt: now,
        lastLoginAt: now,
        isPremium: false,
        subscriptionStatus: 'free',
        dailyConversions: 0,
        adWatches: 0,
        totalConversions: 0,
      };
    }
  };

  // Determinar provider desde FirebaseUser
  const getProviderFromFirebaseUser = (firebaseUser: FirebaseUser): AuthProviderType => {
    const providerId = firebaseUser.providerData[0]?.providerId;

    switch (providerId) {
      case 'google.com':
        return 'google';
      case 'facebook.com':
        return 'facebook';
      case 'github.com':
        return 'github';
      default:
        return 'google'; // fallback
    }
  };

  // Manejar resultado de autenticación
  const handleAuthResult = async (result: UserCredential, provider: AuthProviderType): Promise<UserProfile> => {
    const firebaseUser = result.user;


    const userProfile = await createOrUpdateUserProfile(firebaseUser, provider);

    setUser(userProfile);
    setFirebaseUser(firebaseUser);

    return userProfile;
  };

  // Métodos de autenticación
  const signInWithGoogle = async (): Promise<UserProfile | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return await handleAuthResult(result, 'google');
    } catch (error: any) {
      // No mostrar error si el usuario cerró el popup intencionalmente
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log('Usuario canceló el login de Google');
        return null;
      }

      console.error('Error signing in with Google:', error);
      return null;
    }
  };

  const signInWithFacebook = async (): Promise<UserProfile | null> => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      return await handleAuthResult(result, 'facebook');
    } catch (error: any) {
      // No mostrar error si el usuario cerró el popup intencionalmente
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log('Usuario canceló el login de Facebook');
        return null;
      }

      console.error('Error signing in with Facebook:', error);
      return null;
    }
  };

  const signInWithGithub = async (): Promise<UserProfile | null> => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      return await handleAuthResult(result, 'github');
    } catch (error: any) {
      // No mostrar error si el usuario cerró el popup intencionalmente
      if (error?.code === 'auth/popup-closed-by-user') {
        console.log('Usuario canceló el login de GitHub');
        return null;
      }

      console.error('Error signing in with Github:', error);
      return null;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, updates);

      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!firebaseUser || !user) return false;

    try {
      // Eliminar datos del usuario de Firestore
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);

      // Eliminar cuenta de Firebase Auth
      await deleteUser(firebaseUser);

      // Limpiar estado local
      setUser(null);
      setFirebaseUser(null);

      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  };

  // Escuchar cambios de autenticación
  useEffect(() => {
    let mounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Solo actualizar el estado si el componente sigue montado
      if (!mounted) return;

      if (firebaseUser) {
        try {
          const provider = getProviderFromFirebaseUser(firebaseUser);
          const userProfile = await createOrUpdateUserProfile(firebaseUser, provider);

          if (mounted) {
            setUser(userProfile);
            setFirebaseUser(firebaseUser);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);

          if (mounted) {
            // Si hay error de permisos, crear perfil local básico
            const basicProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Usuario',
              photoURL: firebaseUser.photoURL || undefined,
              provider: getProviderFromFirebaseUser(firebaseUser),
              createdAt: new Date(),
              lastLoginAt: new Date(),
              isPremium: false,
              subscriptionStatus: 'free',
              dailyConversions: 0,
              adWatches: 0,
              totalConversions: 0,
            };
            setUser(basicProfile);
            setFirebaseUser(firebaseUser);
          }
        }
      } else {
        if (mounted) {
          setUser(null);
          setFirebaseUser(null);
        }
      }

      if (mounted) {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    signInWithFacebook,
    signInWithGithub,
    signOut,
    updateUserProfile,
    deleteAccount,
    isRegistered: !!user && !user?.isAnonymous,
    isAnonymous: !user || user?.isAnonymous === true,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};