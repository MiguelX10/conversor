import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'facebook' | 'github' | 'anonymous';
  createdAt: Date;
  lastLoginAt: Date;
  isPremium: boolean;
  subscriptionStatus: 'free' | 'premium' | 'trial';
  subscriptionId?: string;
  dailyConversions: number;
  adWatches: number;
  totalConversions: number;
}

export interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<UserProfile | null>;
  signInWithFacebook: () => Promise<UserProfile | null>;
  signInWithGithub: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteAccount: () => Promise<boolean>;
  isRegistered: boolean;
  isAnonymous: boolean;
}

export interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  trigger: 'conversion_limit' | 'premium_feature' | 'manual';
}

export type AuthProvider = 'google' | 'facebook' | 'github';