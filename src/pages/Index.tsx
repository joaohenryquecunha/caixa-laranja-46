import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialDashboard } from '@/components/FinancialDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionRequiredModal } from '@/components/SubscriptionRequiredModal';
import { PhoneRequiredModal } from '@/components/PhoneRequiredModal';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [phoneChecked, setPhoneChecked] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const {
    subscribed,
    manualAccess,
    subscriptionEnd,
    loading: subscriptionLoading,
    hasValidData,
    createCheckout,
    openCustomerPortal,
    checkSubscription,
  } = useSubscription(phoneChecked);


  useEffect(() => {
    // After we have the user, check if profile has phone. If not, show modal.
    const checkPhone = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('phone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          // If there's an error reading profile, still allow subscription checks to proceed
          setPhoneChecked(true);
          return;
        }

        if (!data || !data.phone) {
          setShowPhoneModal(true);
        } else {
          setPhoneChecked(true);
        }
      } catch (error) {
        console.error('Error checking phone:', error);
        setPhoneChecked(true);
      }
    };

    checkPhone();
  }, [user]);

  const checkAdminStatus = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }

    if (user) {
      checkAdminStatus();
    }
  }, [user, loading, navigate, checkAdminStatus]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer logout.",
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir o portal de gerenciamento.',
        variant: 'destructive',
      });
    }
  };

  const handleSavePhone = async (phone: string) => {
    if (!user) return;

    // Check whether this phone is already associated with another user
    const { data: existingProfile, error: existingError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingProfile && existingProfile.user_id && existingProfile.user_id !== user.id) {
      const message = 'Este telefone já está associado a outra conta. Verifique o número ou entre em contato com o suporte.';
      // throw so the caller (modal) can show an error instead of the modal showing success
      throw new Error(message);
    }

    // include user metadata when creating/updating profile so fields like display_name, email and avatar are preserved
    const profilePayloadBase = {
      user_id: user.id,
      phone,
    };

    // prefer user_metadata full_name or name
    type UM = { full_name?: string; name?: string; avatar_url?: string; picture?: string };
    const um = user.user_metadata as UM | undefined;
    const displayName = um?.full_name ?? um?.name ?? null;
    const avatarUrl = um?.avatar_url ?? um?.picture ?? null;
    const profilePayload = {
      ...profilePayloadBase,
      ...(displayName ? { display_name: displayName } : {}),
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      ...(user.email ? { email: user.email } : {}),
    } as Database['public']['Tables']['profiles']['Insert'];

    const { error } = await supabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'user_id' });

    if (error) throw error;

    setShowPhoneModal(false);
    setPhoneChecked(true);
    // trigger immediate subscription check
    await checkSubscription();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const shouldShowModal = hasValidData && !manualAccess && !subscribed;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pr-4 sm:pr-0">
          <h1 className="text-xl font-bold">Uzzi Finance</h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground max-w-full sm:max-w-xs">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {user.user_metadata?.full_name || user.email}
              </span>
              {subscribed && !manualAccess && (
                <Crown className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="hidden sm:flex flex-wrap items-center gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              {subscribed && !manualAccess && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                  Gerenciar Assinatura
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main>
        <FinancialDashboard
          showManageSubscription={subscribed && !manualAccess}
          onManageSubscription={handleManageSubscription}
          isAdmin={isAdmin}
          onAdmin={() => navigate('/admin')}
          onSignOut={handleSignOut}
        />
      </main>
      <SubscriptionRequiredModal
        open={shouldShowModal}
        isLoading={!hasValidData && subscriptionLoading}
        onSubscribe={createCheckout}
        onRefreshStatus={checkSubscription}
        onOpenPortal={openCustomerPortal}
        onSignOut={handleSignOut}
      />
      <PhoneRequiredModal
        open={showPhoneModal}
        onSave={handleSavePhone}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default Index;
