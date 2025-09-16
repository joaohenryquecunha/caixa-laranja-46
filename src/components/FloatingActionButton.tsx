import { useState } from 'react';
import { Plus, Settings, Building2, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onNewTransaction: () => void;
  onCategoryManager: () => void;
  onCompanyManager: () => void;
}

export function FloatingActionButton({ 
  onNewTransaction, 
  onCategoryManager, 
  onCompanyManager 
}: FloatingActionButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Overlay para fechar o menu ao clicar fora */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Container do FAB */}
      <div className="fixed bottom-6 right-6 z-50 md:hidden">
        {/* Menu de opções */}
        {isMenuOpen && (
          <div className="absolute bottom-16 right-0 mb-2">
            <Card className="bg-background border-border shadow-lg p-2 min-w-[200px]">
              <div className="space-y-2">
                <Button
                  onClick={() => handleAction(onCategoryManager)}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Categorias
                </Button>
                <Button
                  onClick={() => handleAction(onCompanyManager)}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Empresas
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Botão de Nova Transação */}
        <div className="flex flex-col items-end gap-3">
          {/* Botão de Menu */}
          <Button
            onClick={toggleMenu}
            variant="outline"
            size="icon"
            className={cn(
              "h-12 w-12 rounded-full shadow-lg transition-all duration-200",
              "border-border bg-background hover:bg-accent",
              isMenuOpen && "rotate-45"
            )}
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Botão Principal - Nova Transação */}
          <Button
            onClick={onNewTransaction}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all duration-200",
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