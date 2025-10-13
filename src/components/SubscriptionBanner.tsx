import { useSubscription } from '@/hooks/useSubscription';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CreditCard, Crown, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function SubscriptionBanner() {
  const { subscribed, subscriptionEnd, manualAccess, loading, createCheckout, openCustomerPortal } = useSubscription();

  const handleSubscribe = async () => {
    try {
      await createCheckout();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a página de assinatura.',
        variant: 'destructive',
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
    return null;
  }

  if (subscribed || manualAccess) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Assinatura Ativa</CardTitle>
            </div>
            <Badge variant="default" className="bg-primary">
              {manualAccess ? 'Acesso Manual' : 'Premium'}
            </Badge>
          </div>
          {subscriptionEnd && !manualAccess && (
            <CardDescription>
              Renova em {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
            </CardDescription>
          )}
        </CardHeader>
        {!manualAccess && (
          <CardContent>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              className="w-full sm:w-auto"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar Assinatura
            </Button>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="border-warning/20 bg-warning/5">
      <CardHeader>
        <CardTitle className="text-lg">Assine o Caixa Laranja Premium</CardTitle>
        <CardDescription>
          Tenha acesso completo ao sistema de controle financeiro por apenas R$ 9,97/mês
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSubscribe} className="w-full sm:w-auto">
          <CreditCard className="h-4 w-4 mr-2" />
          Assinar Agora
        </Button>
      </CardContent>
    </Card>
  );
}
