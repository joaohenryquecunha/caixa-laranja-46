import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionState {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  manualAccess: boolean;
  loading: boolean;
  hasValidData: boolean;
  error: string | null;
}

export function useSubscription(enabled = true) {
  const { user } = useAuth();
  const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>({
    subscribed: false,
    productId: null,
    subscriptionEnd: null,
    manualAccess: false,
    loading: true,
    hasValidData: false,
    error: null,
  });

  const checkSubscription = useCallback(async () => {
    setSubscriptionState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    if (!user) {
      setSubscriptionState({
        subscribed: false,
        productId: null,
        subscriptionEnd: null,
        manualAccess: false,
        loading: false,
        hasValidData: false,
        error: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      setSubscriptionState({
        subscribed: data.subscribed || false,
        productId: data.product_id || null,
        subscriptionEnd: data.subscription_end || null,
        manualAccess: data.manual_access || false,
        loading: false,
        hasValidData: true,
        error: null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar assinatura',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!enabled) {
      // mark as not loaded yet but not error
      setSubscriptionState(prev => ({ ...prev, loading: false }));
      return;
    }

    checkSubscription();

    // Check every 60 seconds
    const interval = setInterval(checkSubscription, 60000);

    return () => clearInterval(interval);
  }, [checkSubscription, enabled]);

  const createCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
        // Refresh subscription status after a delay
        setTimeout(checkSubscription, 3000);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  return {
    ...subscriptionState,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
