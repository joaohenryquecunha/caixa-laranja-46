import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CreditCard, RefreshCw, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';

interface SubscriptionRequiredModalProps {
  open: boolean;
  isLoading: boolean;
  onSubscribe: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
  onOpenPortal: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function SubscriptionRequiredModal({
  open,
  isLoading,
  onSubscribe,
  onRefreshStatus,
  onOpenPortal,
  onSignOut,
}: SubscriptionRequiredModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (isLoading || !open) {
    return null;
  }

  const handleSubscribe = async () => {
    try {
      setIsSubmitting(true);
      await onSubscribe();
    } catch (error) {
      toast({
        title: 'Erro ao iniciar assinatura',
        description: 'Por favor, tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefreshStatus();
      toast({
        title: 'Status atualizado',
        description: 'Verificamos novamente sua assinatura.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível verificar a assinatura agora.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setIsOpeningPortal(true);
      await onOpenPortal();
    } catch (error) {
      toast({
        title: 'Erro ao abrir portal',
        description: 'Não foi possível abrir o portal de assinaturas.',
        variant: 'destructive',
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const handleSignOut = async () => {
    await onSignOut();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-foreground">
              Assinatura necessária
            </CardTitle>
            <CardDescription className="text-base">
              Para continuar usando o Uzzi Finance, é preciso ter uma assinatura ativa. Caso já tenha assinado recentemente,
              atualize o status abaixo.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleSubscribe}
            disabled={isSubmitting}
            className="w-full h-12 text-base"
          >
            {isSubmitting ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5 mr-2" />
            )}
            {isSubmitting ? 'Abrindo checkout...' : 'Assinar agora'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full h-12 text-base"
          >
            {isRefreshing ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-2" />
            )}
            {isRefreshing ? 'Atualizando...' : 'Atualizar status'}
          </Button>
          <Button
            variant="outline"
            onClick={handleOpenPortal}
            disabled={isOpeningPortal}
            className="w-full h-12 text-base"
          >
            {isOpeningPortal ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="h-5 w-5 mr-2" />
            )}
            {isOpeningPortal ? 'Abrindo portal...' : 'Tenho assinatura, abrir portal'}
          </Button>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground text-center">
            Precisa sair e tentar mais tarde? Você pode encerrar sua sessão com segurança.
          </p>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full h-11 text-base text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Sair da conta
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
