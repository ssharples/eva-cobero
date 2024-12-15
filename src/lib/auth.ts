import { createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  subscription: {
    type: 'monthly' | 'yearly' | null;
    status: 'active' | 'inactive' | null;
    expiresAt: string | null;
  } | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
