import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialDashboard } from '@/components/FinancialDashboard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Shield, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionRequiredModal } from '@/components/SubscriptionRequiredModal';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const {
    subscribed,
    manualAccess,
    subscriptionEnd,
    loading: subscriptionLoading,
    hasValidData,
    createCheckout,
    openCustomerPortal,
    checkSubscription,
  } = useSubscription();
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    
    if (user) {
      checkAdminStatus();
    }
  }, [user, loading, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    setIsAdmin(!!data);
  };

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
    </div>
  );
};

export default Index;
