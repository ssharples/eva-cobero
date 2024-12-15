import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthContext } from '../lib/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<{
    type: 'monthly' | 'yearly' | null;
    status: 'active' | 'inactive' | null;
    expiresAt: string | null;
  } | null>(null);

  useEffect(() => {
    console.log('Checking active session...');
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Session:', session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    }).catch(error => {
      console.error('Error fetching session:', error);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth state changed:', session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        if (session?.user) {
          try {
            console.log('Fetching subscription for user:', session.user.id);
            // Fetch subscription status
            const { data: subscriptionData, error } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (error) {
              console.error('Error fetching subscription:', error);
            } else {
              console.log('Subscription data:', subscriptionData);
              setSubscription({
                type: subscriptionData.type,
                status: subscriptionData.status,
                expiresAt: subscriptionData.expires_at,
              });
            }
          } catch (err) {
            console.error('Unexpected error fetching subscription:', err);
          }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const value = {
    user,
    isLoading,
    signUp,
    signIn,
    signOut,
    subscription,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
