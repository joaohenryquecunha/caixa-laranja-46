import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Função para limpar cache antigo quando necessário
    const clearOldCache = () => {
      try {
        const oldKeys = [
          'financial_transactions',
          'financial_categories',
          'financial_companies',
          'financial_goals',
          'financial_goal_history',
          'sample_data_loaded'
        ];
        
        oldKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            // Ignorar erros silenciosamente
          }
        });
      } catch (error) {
        // Ignorar erros silenciosamente
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Limpar cache quando detectar login ou mudança de sessão
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          clearOldCache();
        }
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Se já houver uma sessão, limpar cache antigo
      if (session) {
        clearOldCache();
      }
      
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return {
    ...authState,
    signOut,
  };
}