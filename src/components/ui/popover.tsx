import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  // Garantir que o container existe antes de renderizar o Portal
  const getPortalContainer = React.useCallback(() => {
    if (typeof document === 'undefined') return undefined;
    try {
      let portalRoot = document.getElementById('radix-portal-root');
      
      // Se não existe, criar o elemento
      if (!portalRoot) {
        portalRoot = document.createElement('div');
        portalRoot.id = 'radix-portal-root';
        document.body.appendChild(portalRoot);
      }
      
      // Verificar se o elemento ainda está no DOM
      if (portalRoot && portalRoot.parentNode && document.body.contains(portalRoot)) {
        return portalRoot;
      }
    } catch (e) {
      // Se houver erro ao acessar o DOM, usar body como fallback
      console.warn('Erro ao obter container do Portal, usando body:', e);
    }
    return document.body;
  }, []);

  return (
    <PopoverPrimitive.Portal container={getPortalContainer()}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-[100] w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        onCloseAutoFocus={(e) => {
          // Prevenir foco automático que pode causar problemas
          e.preventDefault();
        }}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
