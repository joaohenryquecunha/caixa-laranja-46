import { useState, useEffect } from 'react';
import { Plus, Settings, Building2, Menu, X, Target, Crown, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';

interface FloatingActionButtonProps {
  onNewTransaction: () => void;
  onCategoryManager: () => void;
  onCompanyManager: () => void;
  onManageSubscription?: () => void;
  showManageSubscription?: boolean;
  isAdmin?: boolean;
  onAdmin?: () => void;
  onSignOut?: () => void;
  menuButtonContainerClassName?: string;
}

export function FloatingActionButton({ 
  onNewTransaction, 
  onCategoryManager, 
  onCompanyManager,
  onManageSubscription,
  showManageSubscription,
  isAdmin,
  onAdmin,
  onSignOut,
  menuButtonContainerClassName,
}: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (!isMenuOpen) return;
    lockBodyScroll();
    return () => {
      unlockBodyScroll();
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Botão do Menu - Parte Superior Direita */}
      <div
        className={cn(
          "md:hidden z-50",
          menuButtonContainerClassName ?? "fixed top-4 right-4"
        )}
      >
        <Button
          onClick={toggleMenu}
          variant="outline"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-lg shadow-lg transition-all duration-200",
            "border-border bg-background hover:bg-accent",
            isMenuOpen && "rotate-45"
          )}
        >
          {isMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Full Screen Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute inset-0 bg-background/95 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
                <div className="text-lg font-semibold text-foreground">Menu</div>
                <Button
                  onClick={toggleMenu}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg border border-border/60 bg-card hover:bg-card/80"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                <Button
                  onClick={() => {
                    navigate('/metas');
                    setIsMenuOpen(false);
                  }}
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start h-16 text-left bg-card/50 hover:bg-card/80 border border-border/50"
                >
                  <div className="p-3 bg-primary/20 rounded-lg mr-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Metas</div>
                    <div className="text-sm text-muted-foreground">Gerenciar metas financeiras</div>
                  </div>
                </Button>
                {showManageSubscription && onManageSubscription && (
                  <Button
                    onClick={() => handleAction(onManageSubscription)}
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start h-16 text-left bg-card/50 hover:bg-card/80 border border-border/50"
                  >
                    <div className="p-3 bg-primary/20 rounded-lg mr-4">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Gerenciar assinatura</div>
                      <div className="text-sm text-muted-foreground">Acessar portal da Stripe</div>
                    </div>
                  </Button>
                )}

                {isAdmin && onAdmin && (
                  <Button
                    onClick={() => handleAction(onAdmin)}
                    variant="ghost"
                    size="lg"
                    className="w-full justify-start h-16 text-left bg-card/50 hover:bg-card/80 border border-border/50"
                  >
                    <div className="p-3 bg-primary/20 rounded-lg mr-4">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">Painel Admin</div>
                      <div className="text-sm text-muted-foreground">Gerenciar usuários e assinaturas</div>
                    </div>
                  </Button>
                )}
                
                <Button
                  onClick={() => handleAction(onCategoryManager)}
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start h-16 text-left bg-card/50 hover:bg-card/80 border border-border/50"
                >
                  <div className="p-3 bg-primary/20 rounded-lg mr-4">
                    <Settings className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Categorias</div>
                    <div className="text-sm text-muted-foreground">Gerenciar categorias</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleAction(onCompanyManager)}
                  variant="ghost"
                  size="lg"
                  className="w-full justify-start h-16 text-left bg-card/50 hover:bg-card/80 border border-border/50"
                >
                  <div className="p-3 bg-primary/20 rounded-lg mr-4">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Empresas</div>
                    <div className="text-sm text-muted-foreground">Gerenciar empresas</div>
                  </div>
                </Button>
              </div>
              {onSignOut && (
                <div className="px-6 pb-8">
                  <Button
                    onClick={() => handleAction(onSignOut)}
                    variant="outline"
                    size="lg"
                    className="w-full justify-center h-12"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botão de Nova Transação - Parte Inferior */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        <div className="relative">
          {/* Animação de pulse circular */}
          <div className="absolute inset-0 h-14 w-14 rounded-full bg-primary/30 animate-ping"></div>
          <div className="absolute inset-0 h-14 w-14 rounded-full bg-primary/20 animate-pulse"></div>
          
          <Button
            onClick={onNewTransaction}
            className={cn(
              "relative h-14 w-14 rounded-full shadow-lg transition-all duration-200",
              "bg-gradient-to-r from-primary to-primary-glow",
              "hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]",
              "hover:scale-105 active:scale-95"
            )}
          >
            <Plus className="h-6 w-6 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </>
  );
}
